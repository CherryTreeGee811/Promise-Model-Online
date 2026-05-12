using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class ProjectService : GenericService<Project>, IProjectService
    {
        private readonly IProjectRepository _projectRepo;
        private readonly IPermissionRepository _permissionRepo;

        public ProjectService(
            IProjectRepository projectRepo,
            IPermissionRepository permissionRepo)
            : base(projectRepo)
        {
            _projectRepo = projectRepo;
            _permissionRepo = permissionRepo;
        }

        public async Task<IEnumerable<Project>> GetAccessibleProjectsAsync(int userId)
        {
            // Projects the user owns
            var ownedProjects = await _projectRepo.GetProjectsOwnedByUserAsync(userId);

            // Projects shared with the user (any permission status)
            var sharedProjectIds = await _permissionRepo.GetProjectIdsForUserAsync(userId);
            var sharedProjects = new List<Project>();
            foreach (var projectId in sharedProjectIds)
            {
                var project = await _projectRepo.GetByIdAsync(projectId);
                if (project is not null)
                    sharedProjects.Add(project);
            }

            // Combine and deduplicate
            return ownedProjects.Union(sharedProjects, new ProjectComparer());
        }

        private class ProjectComparer : IEqualityComparer<Project>
        {
            public bool Equals(Project? x, Project? y) => x?.Id == y?.Id;
            public int GetHashCode(Project obj) => obj.Id.GetHashCode();
        }
    }
}