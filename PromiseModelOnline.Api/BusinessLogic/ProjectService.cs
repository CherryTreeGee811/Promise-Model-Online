using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
<<<<<<< HEAD
using System.Text.RegularExpressions;
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

            var allProjects = ownedProjects.Union(sharedProjects, new ProjectComparer()).ToList();

            foreach (var project in allProjects)
            {
                if (project.Owner is null)
                {
                    var owner = await _userRepo.GetByIdAsync(project.OwnerId);
                    if (owner is not null)
                        project.Owner = owner;
                }
            }

            return allProjects;
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

            // Only active permissions (invitation accepted)
            var permissions = await _permissionRepo.GetPermissionsByProjectAsync(projectId);
            foreach (var perm in permissions.Where(p => p.Status == PermissionStatus.Active))
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

        public async Task<IEnumerable<Promise>> GetProductPromisesAsync(int projectId)
            => await _projectRepo.GetProductPromisesByProjectAsync(projectId);

        public async Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug)
            => await _projectRepo.GetByOwnerAndSlugAsync(ownerSlug, projectSlug);

        public async Task<string> GenerateProjectSlugAsync(string name, int ownerId)
        {
            var baseSlug = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9\s-]", "")
                .Replace(" ", "-")
                .Replace("--", "-")
                .Trim('-');

            if (string.IsNullOrEmpty(baseSlug))
                baseSlug = "project";

            var slug = baseSlug;
            var suffix = 1;
            while (true)
            {
                var existing = await _projectRepo.GetByOwnerAndSlugAsync(
                    (await _userRepo.GetByIdAsync(ownerId))?.Slug ?? "", slug);
                if (existing is null)
                    return slug;

                suffix++;
                slug = $"{baseSlug}-{suffix}";
            }
        }
||||||| 1bedf4f
=======
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

            // Only active permissions (invitation accepted)
            var permissions = await _permissionRepo.GetPermissionsByProjectAsync(projectId);
            foreach (var perm in permissions.Where(p => p.Status == PermissionStatus.Active))
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

        public async Task<IEnumerable<Promise>> GetProductPromisesAsync(int projectId)
            => await _projectRepo.GetProductPromisesByProjectAsync(projectId);
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

        private class ProjectComparer : IEqualityComparer<Project>
        {
            public bool Equals(Project? x, Project? y) => x?.Id == y?.Id;
            public int GetHashCode(Project obj) => obj.Id.GetHashCode();
        }
    }
}