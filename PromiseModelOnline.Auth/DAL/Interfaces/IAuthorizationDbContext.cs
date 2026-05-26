using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using OpenIddict.EntityFrameworkCore.Models;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.DAL.Interfaces
{
    /// <summary>
    /// Contract for the Authorization DB context used by the Auth service.
    /// </summary>
    public interface IAuthorizationDbContext
    {
        DbSet<IdentityUser> Users { get; set; }

        // OpenIddict entities
        DbSet<OpenIddictEntityFrameworkCoreApplication> OpenIddictApplications { get; set; }
        DbSet<OpenIddictEntityFrameworkCoreAuthorization> OpenIddictAuthorizations { get; set; }
        DbSet<OpenIddictEntityFrameworkCoreScope> OpenIddictScopes { get; set; }
        DbSet<OpenIddictEntityFrameworkCoreToken> OpenIddictTokens { get; set; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}