using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
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

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}