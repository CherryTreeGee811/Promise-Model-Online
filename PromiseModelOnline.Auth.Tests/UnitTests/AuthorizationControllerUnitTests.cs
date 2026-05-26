using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using OpenIddict.Abstractions;

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

        [TearDown]
        public void TearDown()
        {
            _controller?.Dispose();
        }

        private void SetupUser(bool isAuthenticated = true, string? email = "user@test.com")
        {
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

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user
                }
            };
        }

        // =========================================
        // ✅ Unauthorized
        // =========================================

        [Test]
        public void Authorize_WhenUserNotAuthenticated_ReturnsRedirect()
        {
            SetupUser(isAuthenticated: false);

            var result = _controller.Authorize();

            Assert.That(result, Is.InstanceOf<RedirectResult>());

            var redirect = result as RedirectResult;
            Assert.That(redirect!.Url, Does.StartWith("/connect/login"));
        }

        // =========================================
        // ✅ Authenticated (no scope)
        // =========================================

        [Test]
        public void Authorize_WhenAuthenticated_ReturnsSignIn()
        {
            SetupUser();

            _controller.Request.QueryString = new QueryString("?scope=openid");

            var result = _controller.Authorize();

            Assert.That(result, Is.InstanceOf<SignInResult>());
        }

        // =========================================
        // ✅ Includes email claim
        // =========================================

        [Test]
        public void Authorize_WithEmail_AddsEmailClaim()
        {
            SetupUser(email: "user@test.com");

            _controller.Request.QueryString = new QueryString("?scope=openid email");

            var result = _controller.Authorize() as SignInResult;

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
        public void Authorize_WithoutEmail_DoesNotAddEmailClaim()
        {
            SetupUser(email: null);

            _controller.Request.QueryString = new QueryString("?scope=openid");

            var result = _controller.Authorize() as SignInResult;

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
        public void Authorize_WithScopes_SetsScopesOnPrincipal()
        {
            SetupUser();

            _controller.Request.QueryString = new QueryString("?scope=openid profile");

            var result = _controller.Authorize() as SignInResult;

            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;

            // Note: scopes are stored as claims in OpenIddict
            var scopes = principal.GetScopes().ToList();

            Assert.That(scopes, Does.Contain("openid"));
            Assert.That(scopes, Does.Contain("profile"));
        }
    }
}