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
<<<<<<< HEAD
            return await _context.Set<Project>()
                .Where(p => p.OwnerId == userId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Promise>> GetProductPromisesByProjectAsync(int projectId)
        {
            return await _context.Set<Project>()
                .Where(project => project.Id == projectId)
                .SelectMany(project => project.ProductPromises)
                .OrderBy(promise => promise.DisplayOrder)
                .ToListAsync();
        }

        public async Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug)
        {
            return await _context.Set<Project>()
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Owner.Slug == ownerSlug && p.Slug == projectSlug);
||||||| 1bedf4f
=======
            return await FindAsync(p => p.OwnerId == userId);
        }

        public async Task<IEnumerable<Promise>> GetProductPromisesByProjectAsync(int projectId)
        {
            return await _context.Set<Project>()
                .Where(project => project.Id == projectId)
                .SelectMany(project => project.ProductPromises)
                .OrderBy(promise => promise.DisplayOrder)
                .ToListAsync();
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
        }
    }
}