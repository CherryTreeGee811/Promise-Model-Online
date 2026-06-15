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
    /// <summary>Handles OpenID Connect authorization requests (<c>connect/authorize</c>).</summary>
    /// <remarks>
    ///   Processes authorization requests by authenticating the user, validating PKCE S256,
    ///   assigning scopes and resources, and returning a SignIn result with OpenIddict identity claims.
    ///   Unauthenticated users are redirected to the login page.
    /// </remarks>
    [ApiController]
    [Route("connect/authorize")]
    public class AuthorizationController : ControllerBase
    {
        /// <summary>Process authorization requests: authenticate, validate PKCE, assign scopes, and sign in.</summary>
        /// <returns>A SignIn result with OpenIddict identity claims, or a redirect to login for unauthenticated users.</returns>
        /// <response code="302">Redirects unauthenticated users to the login page.</response>
        /// <response code="400">The <c>openid</c> scope is missing or PKCE S256 is not used.</response>
        [HttpGet, HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> Authorize()
        {
            var feature = HttpContext.Features.Get<OpenIddictServerAspNetCoreFeature>()
                ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            var request = feature.Transaction?.Request
                ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            var result = await HttpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);

            if (result == null || !result.Succeeded)
            {
                var returnUrl = Uri.EscapeDataString(Request.Path + Request.QueryString);
                return Redirect($"/account/login?returnUrl={returnUrl}");
            }

            var subject = User.FindFirstValue(OpenIddictConstants.Claims.Subject)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(subject))
                return Forbid();

            var identity = new ClaimsIdentity(
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                OpenIddictConstants.Claims.Name,
                OpenIddictConstants.Claims.Role
            );

            var principal = new ClaimsPrincipal(identity);

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

            var codeChallengeMethod = request.CodeChallengeMethod;
            if (!string.Equals(codeChallengeMethod, "S256", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    error = OpenIddictConstants.Errors.InvalidRequest,
                    error_description = "S256 PKCE challenge method is required."
                });
            }

            if (scopes.Contains("projects.read") || scopes.Contains("projects.write"))
            {
                principal.SetResources("promisemodelonline.api");
            }

            var subClaim = new Claim(OpenIddictConstants.Claims.Subject, subject);
            subClaim.SetDestinations(
                OpenIddictConstants.Destinations.AccessToken,
                OpenIddictConstants.Destinations.IdentityToken
            );
            identity.AddClaim(subClaim);

            if (User.Identity?.Name is { Length: > 0 } name)
            {
                var nameClaim = new Claim(OpenIddictConstants.Claims.Name, name);
                nameClaim.SetDestinations(
                    OpenIddictConstants.Destinations.AccessToken,
                    OpenIddictConstants.Destinations.IdentityToken
                );
                identity.AddClaim(nameClaim);
            }

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

            foreach (var role in User.FindAll(ClaimTypes.Role))
            {
                var roleClaim = new Claim(OpenIddictConstants.Claims.Role, role.Value);
                roleClaim.SetDestinations(
                    OpenIddictConstants.Destinations.AccessToken,
                    OpenIddictConstants.Destinations.IdentityToken
                );
                identity.AddClaim(roleClaim);
            }

            return SignIn(
                principal,
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme
        /// <param name="scope">The scope name.</param>
        /// <param name="principal">The claims principal.</param>
            );
        }

        /// <summary>Return token destinations (access token and identity token if scope is present).</summary>
        private static IEnumerable<string> GetDestinations(string scope, ClaimsPrincipal principal)
        {
            yield return Destinations.AccessToken;
            if (principal.HasScope(scope))
                yield return Destinations.IdentityToken;
        }
    }
}
