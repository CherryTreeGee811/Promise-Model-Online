using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class ProjectService : GenericService<Project>, IProjectService
    {
        private readonly IProjectRepository _projectRepo;
        private readonly IPermissionRepository _permissionRepo;
        private readonly IUserRepository _userRepo;

        public ProjectService(
            IProjectRepository projectRepo,
            IPermissionRepository permissionRepo,
            IUserRepository userRepo)
            : base(projectRepo)
        {
            _projectRepo = projectRepo;
            _permissionRepo = permissionRepo;
            _userRepo = userRepo;
        }

        public async Task<IEnumerable<Project>> GetAccessibleProjectsAsync(int userId)
        {
            var ownedProjects = await _projectRepo.GetProjectsOwnedByUserAsync(userId);

            var sharedProjectIds = await _permissionRepo.GetProjectIdsForUserAsync(userId);
            var sharedProjects = new List<Project>();
            foreach (var projectId in sharedProjectIds)
            {
                var project = await _projectRepo.GetByIdAsync(projectId);
                if (project is not null)
                    sharedProjects.Add(project);
            }

            return ownedProjects.Union(sharedProjects, new ProjectComparer());
        }

        public async Task<IEnumerable<ProjectMemberDTO>> GetProjectMembersAsync(int projectId)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project is null)
                throw new InvalidOperationException("Project not found");

            var members = new List<ProjectMemberDTO>();

            // Owner
            var owner = await _userRepo.GetByIdAsync(project.OwnerId);
            if (owner is not null)
                members.Add(new ProjectMemberDTO
                {
                    UserId = owner.Id,
                    UserName = owner.Name,
                    Email = owner.Email
                });

            // Invited / active permissions
            var permissions = await _permissionRepo.GetPermissionsByProjectAsync(projectId);
            foreach (var perm in permissions)
            {
                if (members.All(m => m.UserId != perm.UserId))
                {
                    var user = await _userRepo.GetByIdAsync(perm.UserId);
                    if (user is not null)
                        members.Add(new ProjectMemberDTO
                        {
                            UserId = user.Id,
                            UserName = user.Name,
                            Email = user.Email
                        });
                }
            }

            return members;
        }

        private class ProjectComparer : IEqualityComparer<Project>
        {
            public bool Equals(Project? x, Project? y) => x?.Id == y?.Id;
            public int GetHashCode(Project obj) => obj.Id.GetHashCode();
        }
    }
}