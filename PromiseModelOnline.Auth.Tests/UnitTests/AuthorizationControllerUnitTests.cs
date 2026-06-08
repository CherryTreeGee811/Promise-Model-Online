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
            string scope = "openid",
            bool includeSubject = true,
            string? codeChallengeMethod = "S256")
        {
            var httpContext = new DefaultHttpContext();

            // OpenIddict request feature.
            var transaction = new OpenIddictServerTransaction
            {
                Request = new OpenIddictRequest
                {
                    Scope = scope,
                    CodeChallengeMethod = codeChallengeMethod
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

            if (includeSubject)
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
        // ✅ Happy path
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

        [Test]
        public async Task Authorize_WhenAuthenticated_ReturnsSignIn()
        {
            SetupHttpContext(scope: "openid");

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<MvcSignInResult>());
        }

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

        [Test]
        public async Task Authorize_WithoutEmail_DoesNotAddEmailClaim()
        {
            SetupHttpContext(email: null, scope: "openid");

            var result = await _controller.Authorize() as MvcSignInResult;

            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;

            var emailClaim = principal.Identities
                .SelectMany(i => i.Claims)
                .FirstOrDefault(c => c.Type == ClaimTypes.Email);

            Assert.That(emailClaim, Is.Null);
        }

        [Test]
        public async Task Authorize_WithScopes_SetsScopesOnPrincipal()
        {
            SetupHttpContext(scope: "openid profile");

            var result = await _controller.Authorize() as MvcSignInResult;

            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;

            var scopes = principal.GetScopes().ToList();

            Assert.That(scopes, Does.Contain("openid"));
            Assert.That(scopes, Does.Contain("profile"));
        }

        // =========================================
        // 🚫 Misuse cases
        // =========================================

        [Test]
        public void Authorize_WhenFeatureMissing_ThrowsInvalidOperation()
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = "/connect/authorize";
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            var ex = Assert.ThrowsAsync<InvalidOperationException>(() => _controller.Authorize());
            Assert.That(ex!.Message, Does.Contain("request cannot be retrieved"));
        }

        [Test]
        public void Authorize_WhenTransactionRequestNull_ThrowsInvalidOperation()
        {
            var httpContext = new DefaultHttpContext();
            httpContext.Features.Set(new OpenIddictServerAspNetCoreFeature
            {
                Transaction = new OpenIddictServerTransaction()
            });
            httpContext.Request.Path = "/connect/authorize";
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            var ex = Assert.ThrowsAsync<InvalidOperationException>(() => _controller.Authorize());
            Assert.That(ex!.Message, Does.Contain("request cannot be retrieved"));
        }

        [Test]
        public async Task Authorize_WithoutSubject_ReturnsForbid()
        {
            // Authenticated user but missing NameIdentifier claim
            SetupHttpContext(scope: "openid", includeSubject: false);

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task Authorize_WithoutOpenIdScope_ReturnsBadRequest()
        {
            // scope = "profile" not "openid"
            SetupHttpContext(scope: "profile");

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

            var badRequest = result as BadRequestObjectResult;
            Assert.That(badRequest!.Value, Is.Not.Null);
        }

        [Test]
        public async Task Authorize_WithEmptyScope_ReturnsBadRequest()
        {
            SetupHttpContext(scope: "");

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Authorize_WithPlainPkceMethod_ReturnsBadRequest()
        {
            var httpContext = new DefaultHttpContext();

            var transaction = new OpenIddictServerTransaction
            {
                Request = new OpenIddictRequest
                {
                    Scope = "openid",
                    CodeChallengeMethod = "plain"
                }
            };

            httpContext.Features.Set(new OpenIddictServerAspNetCoreFeature
            {
                Transaction = transaction
            });

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, "123"),
                new(ClaimTypes.Name, "tester")
            };

            var identity = new ClaimsIdentity(claims, "test");
            httpContext.User = new ClaimsPrincipal(identity);

            var authService = new Mock<IAuthenticationService>();
            authService
                .Setup(s => s.AuthenticateAsync(httpContext, IdentityConstants.ApplicationScheme))
                .ReturnsAsync(AuthenticateResult.Success(new AuthenticationTicket(httpContext.User, IdentityConstants.ApplicationScheme)));

            httpContext.RequestServices = new ServiceCollection()
                .AddSingleton(authService.Object)
                .BuildServiceProvider();

            httpContext.Request.Path = "/connect/authorize";
            httpContext.Request.QueryString = new QueryString("?scope=openid&code_challenge_method=plain");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            var result = await _controller.Authorize();

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Authorize_WithRole_AddsRoleClaim()
        {
            var httpContext = new DefaultHttpContext();

            var transaction = new OpenIddictServerTransaction
            {
                Request = new OpenIddictRequest
                {
                    Scope = "openid",
                    CodeChallengeMethod = "S256"
                }
            };

            httpContext.Features.Set(new OpenIddictServerAspNetCoreFeature
            {
                Transaction = transaction
            });

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, "123"),
                new(ClaimTypes.Name, "tester"),
                new(ClaimTypes.Role, "admin"),
                new(ClaimTypes.Role, "moderator")
            };

            var identity = new ClaimsIdentity(claims, "test");
            var user = new ClaimsPrincipal(identity);
            httpContext.User = user;

            var authService = new Mock<IAuthenticationService>();
            var ticket = new AuthenticationTicket(user, IdentityConstants.ApplicationScheme);
            authService
                .Setup(s => s.AuthenticateAsync(httpContext, IdentityConstants.ApplicationScheme))
                .ReturnsAsync(AuthenticateResult.Success(ticket));

            httpContext.RequestServices = new ServiceCollection()
                .AddSingleton(authService.Object)
                .BuildServiceProvider();

            httpContext.Request.Path = "/connect/authorize";
            httpContext.Request.QueryString = new QueryString("?scope=openid");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            var result = await _controller.Authorize() as MvcSignInResult;
            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;
            var roleClaims = principal.FindAll(OpenIddictConstants.Claims.Role).ToList();

            Assert.That(roleClaims, Has.Count.EqualTo(2));
            Assert.That(roleClaims.Select(c => c.Value), Does.Contain("admin"));
            Assert.That(roleClaims.Select(c => c.Value), Does.Contain("moderator"));
        }
    }
}