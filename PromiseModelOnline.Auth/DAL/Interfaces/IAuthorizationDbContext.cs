using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
<<<<<<< HEAD
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
||||||| 1bedf4f
=======
using System.Threading;
using System.Threading.Tasks;
using PromiseModelOnline.Auth.Models;

namespace PromiseModelOnline.Auth.DAL.Interfaces
{
    /// <summary>
    /// Contract for the Authorization DB context used by the Auth service.
    /// </summary>
    public interface IAuthorizationDbContext
    {
        DbSet<IdentityUser> Users { get; set; }

        DbSet<RefreshToken> RefreshTokens { get; set; }
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}