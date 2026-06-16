using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Business logic for <see cref="Project"/> entities with access control and slug generation.</summary>
    /// <remarks>
    ///   Composes <see cref="IProjectRepository"/>, <see cref="IPermissionRepository"/>, and
    ///   <see cref="IUserRepository"/> to implement project access discovery, member enumeration,
    ///   promise tree traversal, and unique slug generation. Scoped lifetime.
    /// </remarks>
    public class ProjectService : GenericService<Project>, IProjectService
    {
        private readonly IProjectRepository _projectRepo;
        private readonly IPermissionRepository _permissionRepo;
        private readonly IUserRepository _userRepo;

        /// <summary>Initializes a new instance of the <see cref="ProjectService"/> class.</summary>
        /// <param name="projectRepo">The project repository.</param>
        /// <param name="permissionRepo">The permission repository.</param>
        /// <param name="userRepo">The user repository.</param>
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

        /// <summary>Return projects accessible to a user (owned or shared).</summary>
        /// <remarks>
        ///   Unions owned projects with projects where the user has any permission record.
        ///   Eagerly loads the project owner's user data for each result.
        /// </remarks>
        /// <param name="userId">The user ID. Must be greater than zero.</param>
        /// <returns>All projects the user can access, deduplicated.</returns>
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

        /// <summary>Return the member list for a project (owner + active permission users).</summary>
        /// <param name="projectId">The project ID.</param>
        /// <returns>Project member DTOs with user name and email.</returns>
        /// <exception cref="InvalidOperationException">Project not found.</exception>
        public async Task<IEnumerable<ProjectMemberDTO>> GetProjectMembersAsync(int projectId)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project is null)
                throw new InvalidOperationException("Project not found");

            var members = new List<ProjectMemberDTO>();

            var owner = await _userRepo.GetByIdAsync(project.OwnerId);
            if (owner is not null)
                members.Add(new ProjectMemberDTO
                {
                    UserId = owner.Id,
                    UserName = owner.Name,
                    Email = owner.Email
                });

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

        /// <summary>Return the top-level product promises for a project.</summary>
        /// <param name="projectId">The project ID.</param>
        /// <returns>All top-level promises, ordered by display order.</returns>
        public async Task<IEnumerable<Promise>> GetProductPromisesAsync(int projectId)
            => await _projectRepo.GetProductPromisesByProjectAsync(projectId);

        /// <summary>Look up a project by owner slug and project slug.</summary>
        /// <param name="ownerSlug">The owner's URL-safe slug.</param>
        /// <param name="projectSlug">The project's URL-safe slug.</param>
        /// <returns>The matching project, or <c>null</c>.</returns>
        public async Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug)
            => await _projectRepo.GetByOwnerAndSlugAsync(ownerSlug, projectSlug);

        /// <summary>Generate a unique URL-safe slug for a project within the owner's namespace.</summary>
        /// <remarks>
        ///   Normalizes the name (lowercase, removes special chars, replaces spaces with hyphens)
        ///   and appends a numeric suffix if the slug already exists for this owner.
        /// </remarks>
        /// <param name="name">The project name to base the slug on.</param>
        /// <param name="ownerId">The owner's user ID.</param>
        /// <returns>A unique slug string.</returns>
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

        /// <param name="x">The first project to compare.</param>
        /// <param name="y">The second project to compare.</param>
        /// <summary>Equality comparer for <see cref="Project"/> based on ID.</summary>
        private class ProjectComparer : IEqualityComparer<Project>
        /// <param name="obj">The project to get the hash code for.</param>
        {
            /// <summary>Compare two projects by ID.</summary>
            public bool Equals(Project? x, Project? y) => x?.Id == y?.Id;
            /// <summary>Get hash code from project ID.</summary>
            public int GetHashCode(Project obj) => obj.Id.GetHashCode();
        }
    }
}