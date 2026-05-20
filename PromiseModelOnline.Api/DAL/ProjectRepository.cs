using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
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

        public async Task<IEnumerable<Promise>> GetProductPromisesByProjectAsync(int projectId)
        {
            return await _context.Set<Project>()
                .Where(project => project.Id == projectId)
                .SelectMany(project => project.ProductPromises)
                .OrderBy(promise => promise.DisplayOrder)
                .ToListAsync();
        }
    }
}