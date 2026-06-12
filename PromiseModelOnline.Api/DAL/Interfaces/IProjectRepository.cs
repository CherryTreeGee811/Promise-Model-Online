using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IProjectRepository : IGenericRepository<Project>
    {
        Task<IEnumerable<Project>> GetProjectsOwnedByUserAsync(int userId);
        Task<IEnumerable<Promise>> GetProductPromisesByProjectAsync(int projectId);
<<<<<<< HEAD
        Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug);
||||||| 1bedf4f
=======
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}