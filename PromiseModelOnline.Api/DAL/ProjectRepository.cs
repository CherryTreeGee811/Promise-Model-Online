using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class ProjectRepository : GenericRepository<Project>, IProjectRepository
    {
        public ProjectRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Project>> GetProjectsOwnedByUserAsync(int userId)
        {
            return await FindAsync(p => p.OwnerId == userId);
        }
    }
}