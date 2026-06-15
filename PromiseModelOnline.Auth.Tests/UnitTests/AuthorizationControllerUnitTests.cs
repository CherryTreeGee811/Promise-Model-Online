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
    /// <summary>Unit tests for <see cref="AuthorizationController"/> covering OIDC authorize endpoint, scope validation, PKCE enforcement, and OAuth 2.1 compliance.</summary>
    // Requirements: REQ_INT_002 REQ_INT_015 REQ_INT_016 REQ_OAUTH_001 REQ_OAUTH_002 REQ_OIDC_002 REQ_OIDC_006
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
        [Description("REQ_OIDC_002: Unauthenticated requests redirect to login")]
        public async Task REQ_INT_002_Authorize_WhenUserNotAuthenticated_ReturnsRedirect()
        {
            // Arrange
            SetupHttpContext(isAuthenticated: false, scope: "openid");
            // Act
            var result = await _controller.Authorize();
            // Assert
            Assert.That(result, Is.InstanceOf<RedirectResult>());

            var redirect = result as RedirectResult;
            Assert.That(redirect!.Url, Does.StartWith("/account/login"));
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WhenAuthenticated_ReturnsSignIn()
        {
            // Arrange
            SetupHttpContext(scope: "openid");
            // Act
            var result = await _controller.Authorize();
            // Assert
            Assert.That(result, Is.InstanceOf<MvcSignInResult>());
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WithEmail_AddsEmailClaim()
        {
            // Arrange
            SetupHttpContext(email: "user@test.com", scope: "openid email");
            // Act
            var result = await _controller.Authorize() as MvcSignInResult;
            // Assert
            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;
            var emailClaim = principal.FindFirst(OpenIddictConstants.Claims.Email);

            Assert.That(emailClaim, Is.Not.Null);
            Assert.That(emailClaim!.Value, Is.EqualTo("user@test.com"));
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WithoutEmail_DoesNotAddEmailClaim()
        {
            // Arrange
            SetupHttpContext(email: null, scope: "openid");
            // Act
            var result = await _controller.Authorize() as MvcSignInResult;
            // Assert
            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;

            var emailClaim = principal.Identities
                .SelectMany(i => i.Claims)
                .FirstOrDefault(c => c.Type == ClaimTypes.Email);

            Assert.That(emailClaim, Is.Null);
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WithScopes_SetsScopesOnPrincipal()
        {
            // Arrange
            SetupHttpContext(scope: "openid profile");
            // Act
            var result = await _controller.Authorize() as MvcSignInResult;
            // Assert
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
        public void REQ_INT_002_Authorize_WhenFeatureMissing_ThrowsInvalidOperation()
        {
            // Arrange
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = "/connect/authorize";
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
            // Act & Assert
            var ex = Assert.ThrowsAsync<InvalidOperationException>(() => _controller.Authorize());
            Assert.That(ex!.Message, Does.Contain("request cannot be retrieved"));
        }

        [Test]
        public void REQ_INT_002_Authorize_WhenTransactionRequestNull_ThrowsInvalidOperation()
        {
            // Arrange
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
            // Act & Assert
            var ex = Assert.ThrowsAsync<InvalidOperationException>(() => _controller.Authorize());
            Assert.That(ex!.Message, Does.Contain("request cannot be retrieved"));
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WithoutSubject_ReturnsForbid()
        {
            // Arrange - Authenticated user but missing NameIdentifier claim
            SetupHttpContext(scope: "openid", includeSubject: false);
            // Act
            var result = await _controller.Authorize();
            // Assert
            Assert.That(result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        [Description("REQ_OIDC_006: openid scope is required for authorization")]
        public async Task REQ_INT_002_Authorize_WithoutOpenIdScope_ReturnsBadRequest()
        {
            // Arrange - scope = "profile" not "openid"
            SetupHttpContext(scope: "profile");
            // Act
            var result = await _controller.Authorize();
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());

            var badRequest = result as BadRequestObjectResult;
            Assert.That(badRequest!.Value, Is.Not.Null);
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WithEmptyScope_ReturnsBadRequest()
        {
            // Arrange
            SetupHttpContext(scope: "");
            // Act
            var result = await _controller.Authorize();
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        [Description("REQ_OAUTH_002: Only S256 PKCE is accepted (plain rejected)")]
        public async Task REQ_INT_002_Authorize_WithPlainPkceMethod_ReturnsBadRequest()
        {
            // Arrange
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
            // Act
            var result = await _controller.Authorize();
            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task REQ_INT_002_Authorize_WithRole_AddsRoleClaim()
        {
            // Arrange
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
            // Act
            var result = await _controller.Authorize() as MvcSignInResult;
            // Assert
            Assert.That(result, Is.Not.Null);

            var principal = result!.Principal;
            var roleClaims = principal.FindAll(OpenIddictConstants.Claims.Role).ToList();

            Assert.That(roleClaims, Has.Count.EqualTo(2));
            Assert.That(roleClaims.Select(c => c.Value), Does.Contain("admin"));
            Assert.That(roleClaims.Select(c => c.Value), Does.Contain("moderator"));
        }
    }
}