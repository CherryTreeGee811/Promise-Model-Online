using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace PromiseModelOnline.Api.Auth;

/// <summary>
        /// <param name="context">The claims transformation context.</param>
/// Scope Claims Transformer.
/// </summary>
public class ScopeClaimsTransformer : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.HasClaim(c => c.Type == "scope" && c.Value.Contains(' ')))
        {
            var identity = new ClaimsIdentity(principal.Identity);
            foreach (var scopeClaim in principal.FindAll("scope").ToList())
            {
                var scopes = scopeClaim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var scope in scopes)
                {
                    identity.AddClaim(new Claim("scope", scope));
                }
            }
            return Task.FromResult(new ClaimsPrincipal(identity));
        }

        return Task.FromResult(principal);
    }
}
