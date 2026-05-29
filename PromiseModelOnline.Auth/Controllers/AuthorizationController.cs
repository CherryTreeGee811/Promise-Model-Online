using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.Http;
using static OpenIddict.Abstractions.OpenIddictConstants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication;

namespace PromiseModelOnline.Auth.Controllers
{
    [ApiController]
    [Route("connect/authorize")]
    public class AuthorizationController : ControllerBase
    {
        [HttpGet, HttpPost]
        [IgnoreAntiforgeryToken]
        public IActionResult Authorize()
        {
            // ✅ 1. Get OpenIddict request
            var feature = HttpContext.Features.Get<OpenIddictServerAspNetCoreFeature>()
                ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            var request = feature.Transaction?.Request
                ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved");

            // ✅ 2. If user is not logged in → redirect to login
            var result = HttpContext.AuthenticateAsync(
                IdentityConstants.ApplicationScheme).Result;

            if (result == null || !result.Succeeded)
            {
                var relativeUrl = Request.Path + Request.QueryString;
                var returnUrl = Uri.EscapeDataString(relativeUrl);

                return Redirect($"/connect/login?returnUrl={returnUrl}");
            }


            // ✅ 3. Resolve subject (user id)
            var subject = User.FindFirstValue(OpenIddictConstants.Claims.Subject)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(subject))
            {
                return Forbid();
            }

            // ✅ 4. Create identity for OpenIddict
            var identity = new ClaimsIdentity(
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                OpenIddictConstants.Claims.Name,
                OpenIddictConstants.Claims.Role
            );

            var principal = new ClaimsPrincipal(identity);

            // ✅ 5. Get scopes from request
            var scopes = request.GetScopes();

            if (!scopes.Contains(OpenIddictConstants.Scopes.OpenId))
            {
                return BadRequest(new
                {
                    error = OpenIddictConstants.Errors.InvalidRequest,
                    error_description = "The 'openid' scope is required."
                });
            }

            principal.SetScopes(scopes.ToList());

            // ✅ 6. Assign API resource
            if (scopes.Contains("projects.read") || scopes.Contains("projects.write"))
            {
                principal.SetResources("promisemodelonline.api");
            }

            // ✅ 7. Add required claims

            // sub
            var subClaim = new Claim(OpenIddictConstants.Claims.Subject, subject);
            subClaim.SetDestinations(
                OpenIddictConstants.Destinations.AccessToken,
                OpenIddictConstants.Destinations.IdentityToken
            );
            identity.AddClaim(subClaim);

            // name
            if (!string.IsNullOrEmpty(User.Identity.Name))
            {
                var nameClaim = new Claim(OpenIddictConstants.Claims.Name, User.Identity.Name);
                nameClaim.SetDestinations(
                    OpenIddictConstants.Destinations.AccessToken,
                    OpenIddictConstants.Destinations.IdentityToken
                );
                identity.AddClaim(nameClaim);
            }

            // email
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                var emailClaim = new Claim(OpenIddictConstants.Claims.Email, email);
                emailClaim.SetDestinations(
                    OpenIddictConstants.Destinations.AccessToken,
                    OpenIddictConstants.Destinations.IdentityToken
                );
                identity.AddClaim(emailClaim);
            }

            // roles
            foreach (var role in User.FindAll(ClaimTypes.Role))
            {
                var roleClaim = new Claim(OpenIddictConstants.Claims.Role, role.Value);
                roleClaim.SetDestinations(
                    OpenIddictConstants.Destinations.AccessToken,
                    OpenIddictConstants.Destinations.IdentityToken
                );
                identity.AddClaim(roleClaim);
            }

            // ✅ ✅ ✅ CRITICAL FIX: return with AuthenticationProperties
            return SignIn(
                principal,
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme
            );
        }

        private static IEnumerable<string> GetDestinations(string scope, ClaimsPrincipal principal)
        {
            yield return Destinations.AccessToken;

            if (principal.HasScope(scope))
            {
                yield return Destinations.IdentityToken;
            }
        }
    }
}