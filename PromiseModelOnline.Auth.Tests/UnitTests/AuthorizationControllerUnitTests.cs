using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MvcSignInResult = Microsoft.AspNetCore.Mvc.SignInResult;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using OpenIddict.Abstractions;
using OpenIddict.Server;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Tests.UnitTests.Controllers
{
    public class AuthorizationControllerUnitTests
    {
        private AuthorizationController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _controller = new AuthorizationController();
        }

        private void SetupHttpContext(
            bool isAuthenticated = true,
            string? email = "user@test.com",
            string scope = "openid")
        {
            var httpContext = new DefaultHttpContext();

            // OpenIddict request feature.
            var transaction = new OpenIddictServerTransaction
            {
                Request = new OpenIddictRequest
                {
                    Scope = scope
                }
            };

            httpContext.Features.Set(new OpenIddictServerAspNetCoreFeature
            {
                Transaction = transaction
            });

            var claims = new List<Claim>();

            if (!string.IsNullOrEmpty(email))
                claims.Add(new Claim(ClaimTypes.Email, email));

            claims.Add(new Claim(ClaimTypes.Name, "tester"));

            // ✅ REQUIRED
            claims.Add(new Claim(ClaimTypes.NameIdentifier, "123"));

            var identity = new ClaimsIdentity(
                isAuthenticated ? claims : new List<Claim>(),
                isAuthenticated ? "test" : null);

            var user = new ClaimsPrincipal(identity);

            httpContext.User = user;

            // Make HttpContext.AuthenticateAsync() work in unit tests.
            var authService = new Mock<IAuthenticationService>();
            if (isAuthenticated)
            {
                var ticket = new AuthenticationTicket(user, IdentityConstants.ApplicationScheme);
                authService
                    .Setup(s => s.AuthenticateAsync(httpContext, IdentityConstants.ApplicationScheme))
                    .ReturnsAsync(AuthenticateResult.Success(ticket));
            }
            else
            {
                authService
                    .Setup(s => s.AuthenticateAsync(httpContext, IdentityConstants.ApplicationScheme))
                    .ReturnsAsync(AuthenticateResult.Fail("not authenticated"));
            }

            httpContext.RequestServices = new ServiceCollection()
                .AddSingleton(authService.Object)
                .BuildServiceProvider();

            httpContext.Request.Path = "/connect/authorize";
            httpContext.Request.QueryString = new QueryString("?scope=" + Uri.EscapeDataString(scope));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }

        // =========================================
        // ✅ Unauthorized
        // =========================================

        [Test]
        public async Task Authorize_WhenUserNotAuthenticated_ReturnsRedirect()
        {
            SetupHttpContext(isAuthenticated: false, scope: "openid");

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<RedirectResult>());

            var redirect = result as RedirectResult;
            Assert.That(redirect!.Url, Does.StartWith("/account/login"));
        }

        // =========================================
        // ✅ Authenticated (no scope)
        // =========================================

        [Test]
        public async Task Authorize_WhenAuthenticated_ReturnsSignIn()
        {
            SetupHttpContext(scope: "openid");

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<MvcSignInResult>());
        }

        // =========================================
        // ✅ Includes email claim
        // =========================================

        [Test]
        public async Task Authorize_WithEmail_AddsEmailClaim()
        {
            SetupHttpContext(email: "user@test.com", scope: "openid email");

            var result = await _controller.Authorize() as MvcSignInResult;

            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;
            var emailClaim = principal.FindFirst(OpenIddictConstants.Claims.Email);

            Assert.That(emailClaim, Is.Not.Null);
            Assert.That(emailClaim!.Value, Is.EqualTo("user@test.com"));
        }

        // =========================================
        // ✅ Without email (optional behavior)
        // =========================================

        [Test]
        public async Task Authorize_WithoutEmail_DoesNotAddEmailClaim()
        {
            SetupHttpContext(email: null, scope: "openid");

            var result = await _controller.Authorize() as MvcSignInResult;

            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;

            // ✅ look at identity instead of flattened principal
            var emailClaim = principal.Identities
                .SelectMany(i => i.Claims)
                .FirstOrDefault(c => c.Type == ClaimTypes.Email);

            Assert.That(emailClaim, Is.Null);
        }

        // =========================================
        // ✅ Scopes applied
        // =========================================

        [Test]
        public async Task Authorize_WithScopes_SetsScopesOnPrincipal()
        {
            SetupHttpContext(scope: "openid profile");

            var result = await _controller.Authorize() as MvcSignInResult;

            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;

            // Note: scopes are stored as claims in OpenIddict
            var scopes = principal.GetScopes().ToList();

            Assert.That(scopes, Does.Contain("openid"));
            Assert.That(scopes, Does.Contain("profile"));
        }
    }
}