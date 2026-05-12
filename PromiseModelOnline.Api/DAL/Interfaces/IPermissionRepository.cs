using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IPermissionRepository : IGenericRepository<Permission>
    {
        Task<IEnumerable<Permission>> GetPermissionsByProjectAsync(int projectId);
        Task<IEnumerable<Permission>> GetPendingInvitationsForUserAsync(int userId);
        Task<Permission?> GetByUserAndProjectAsync(int userId, int projectId);
        Task<IEnumerable<int>> GetProjectIdsForUserAsync(int userId);
    }
}