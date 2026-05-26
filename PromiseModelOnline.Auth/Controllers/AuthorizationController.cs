using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Abstractions;
using Microsoft.AspNetCore.Http;
using static OpenIddict.Abstractions.OpenIddictConstants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;

namespace PromiseModelOnline.Auth.Controllers
{
    [ApiController]
    [Route("connect/authorize")]
    public class AuthorizationController : ControllerBase
    {
        [HttpGet, HttpPost]
        [IgnoreAntiforgeryToken] // OAuth request validation is handled directly by OpenIddict cryptographic state parameters
        public IActionResult Authorize()
        {
            // 1. Resolve OpenIddict's securely parsed native request object
            var request = HttpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            // 2. Evaluate interactive identity session context
            if (!User.Identity!.IsAuthenticated)
            {
                var relativeUrl = Request.Path + Request.QueryString;
                var returnUrl = Uri.EscapeDataString(relativeUrl);
                
                // ✅ FIXED: Points to the correct route mapping defined on LoginController
                return Redirect($"/connect/login?returnUrl={returnUrl}");
            }

            var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(subject))
            {
                return Forbid();
            }

            // 3. Instantiate ClaimsIdentity explicitly mapping internal OpenIddict schema rules
            var identity = new ClaimsIdentity(
                authenticationType: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
                nameType: Claims.Name,
                roleType: Claims.Role);

            var principal = new ClaimsPrincipal(identity);

            // ✅ FIXED: Use OpenIddict request helper extensions instead of raw Request.Query parsing
            var scopes = request.GetScopes();
            Console.WriteLine($"[AUTH-DEBUG] /connect/authorize scopes: {string.Join(' ', scopes)}");
            if (!scopes.Contains(Scopes.OpenId))
            {
                return BadRequest(new { error = Errors.InvalidRequest, error_description = "The 'openid' scope parameter must be supplied." });
            }

            principal.SetScopes(scopes);

            // 4. Resource Allocation Auditing
            if (principal.HasScope("projects.read") || principal.HasScope("projects.write"))
            {
                principal.SetResources("promisemodelonline.api");
            }

            // 5. Build Token Destinations
            var subjectClaim = new Claim(Claims.Subject, subject);
            subjectClaim.SetDestinations(Destinations.AccessToken, Destinations.IdentityToken);
            identity.AddClaim(subjectClaim);

            if (!string.IsNullOrEmpty(User.Identity.Name))
            {
                var nameClaim = new Claim(Claims.Name, User.Identity.Name);
                nameClaim.SetDestinations(GetDestinations(Scopes.Profile, principal));
                identity.AddClaim(nameClaim);
            }
            
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                var emailClaim = new Claim(Claims.Email, email);
                emailClaim.SetDestinations(GetDestinations(Scopes.Email, principal));
                identity.AddClaim(emailClaim);
            }

            foreach (var roleClaim in User.FindAll(ClaimTypes.Role))
            {
                var targetRoleClaim = new Claim(Claims.Role, roleClaim.Value);
                targetRoleClaim.SetDestinations(Destinations.AccessToken, Destinations.IdentityToken);
                identity.AddClaim(targetRoleClaim);
            }

            return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        [HttpPost("~/connect/token")]
        [Produces("application/json")]
        public async Task<IActionResult> Exchange()
        {
            var request = HttpContext.GetOpenIddictServerRequest() ??
                throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

            if (request.IsAuthorizationCodeGrantType() || request.IsRefreshTokenGrantType())
            {
                // 1. Retrieve the claims principal stored in the authorization code/refresh token.
                var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

                // 2. Create a new ClaimsPrincipal to sign in.
                var principal = result.Principal;

                // 3. Return the tokens to the client.
                // TokenCookieMiddleware will intercept this 200 OK and strip the refresh_token
                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            throw new InvalidOperationException("The specified grant type is not supported.");
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