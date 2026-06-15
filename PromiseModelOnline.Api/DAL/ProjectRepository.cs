using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    /// <summary>EF Core implementation of <see cref="IProjectRepository"/> with ownership and slug-based queries.</summary>
    /// <remarks>
    ///   Scoped lifetime. Uses a mix of <see cref="GenericRepository{T}.FindAsync"/> and direct
    ///   <see cref="DbContext"/> queries for eager-loading and navigation property traversal.
    /// </remarks>
    public class ProjectRepository : GenericRepository<Project>, IProjectRepository
    {
        /// <summary>Initializes the repository with the shared database context.</summary>
        /// <param name="context">The EF Core database context.</param>
        public ProjectRepository(PromiseModelOnlineContext context) : base(context) { }

        /// <summary>Return all projects where the specified user is the owner.</summary>
        /// <param name="userId">The owner's user ID. Must be greater than zero.</param>
        /// <returns>Projects where <c>OwnerId == userId</c>. Empty if none.</returns>
        public async Task<IEnumerable<Project>> GetProjectsOwnedByUserAsync(int userId)
        {
            return await _context.Set<Project>()
                .Where(p => p.OwnerId == userId)
                .ToListAsync();
        }

        /// <summary>Return the top-level product promises for a project, ordered by display order.</summary>
        /// <remarks>
        ///   Navigates the <see cref="Project.ProductPromises"/> navigation property.
        /// </remarks>
        /// <param name="projectId">The project ID. Must be greater than zero.</param>
        /// <returns>All top-level promises, ordered by <see cref="Promise.DisplayOrder"/>.</returns>
        public async Task<IEnumerable<Promise>> GetProductPromisesByProjectAsync(int projectId)
        {
            return await _context.Set<Project>()
                .Where(project => project.Id == projectId)
                .SelectMany(project => project.ProductPromises)
                .OrderBy(promise => promise.DisplayOrder)
                .ToListAsync();
        }

        /// <summary>Look up a project by its owner-slug and project-slug pair (canonical URL identifier).</summary>
        /// <remarks>
        ///   Eagerly loads the <see cref="Project.Owner"/> navigation property so both slugs can
        ///   be evaluated in a single round-trip.
        /// </remarks>
        /// <param name="ownerSlug">The URL-safe slug of the project owner. Case-sensitive. Not null.</param>
        /// <param name="projectSlug">The URL-safe slug of the project. Case-sensitive. Not null.</param>
        /// <returns>The matching project with <c>Owner</c> populated, or <c>null</c> if not found.</returns>
        public async Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug)
        {
            return await _context.Set<Project>()
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Owner.Slug == ownerSlug && p.Slug == projectSlug);
        }
    }
}
