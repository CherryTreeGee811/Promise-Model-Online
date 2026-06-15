using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using OpenIddict.EntityFrameworkCore.Models;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.DAL.Interfaces
{
    /// <summary>Contract for the authorization database context used by the Auth service.</summary>
    /// <remarks>
    ///   Exposes Identity user and OpenIddict application/authorization/scope/token entity sets.
    /// </remarks>
    public interface IAuthorizationDbContext
    {
        /// <summary>Identity users.</summary>
        DbSet<IdentityUser> Users { get; set; }

        /// <summary>OpenIddict registered applications (OAuth2 clients).</summary>
        DbSet<OpenIddictEntityFrameworkCoreApplication> OpenIddictApplications { get; set; }
        
        /// <summary>OpenIddict authorization records.</summary>
        DbSet<OpenIddictEntityFrameworkCoreAuthorization> OpenIddictAuthorizations { get; set; }
        
        /// <summary>OpenIddict scopes.</summary>
        DbSet<OpenIddictEntityFrameworkCoreScope> OpenIddictScopes { get; set; }
        
        /// <summary>OpenIddict token records.</summary>
        DbSet<OpenIddictEntityFrameworkCoreToken> OpenIddictTokens { get; set; }

        /// <summary>Persist changes to the database.</summary>
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
