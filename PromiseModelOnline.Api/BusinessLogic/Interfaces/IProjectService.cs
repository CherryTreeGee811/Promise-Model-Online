using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="Project"/> business logic with access control and slug management.</summary>
/// <remarks>
///   Builds on <see cref="IGenericService{T}"/> with queries for accessible projects (owned or
///   shared), membership enumeration, promise tree traversal, and slug generation.
///   Scoped lifetime.
/// </remarks>
public interface IProjectService : IGenericService<Project>
{
    /// <summary>Return projects accessible to a user (owned or shared via permission).</summary>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <returns>Projects owned by or shared with the user.</returns>
    Task<IEnumerable<Project>> GetAccessibleProjectsAsync(int userId);

    /// <summary>Return the member list for a project with their roles.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>Project members as <see cref="ProjectMemberDto"/> items.</returns>
    Task<IEnumerable<ProjectMemberDto>> GetProjectMembersAsync(int projectId);

    /// <summary>Return the top-level product promises for a project.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>All top-level promises, ordered by display order.</returns>
    Task<IEnumerable<Promise>> GetProductPromisesAsync(int projectId);

    /// <summary>Look up a project by the canonical owner-slug and project-slug pair.</summary>
    /// <param name="ownerSlug">The project owner's URL-safe slug.</param>
    /// <param name="projectSlug">The project's URL-safe slug.</param>
    /// <returns>The matching project, or <c>null</c> if not found.</returns>
    Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug);

    /// <summary>Generate a unique URL-safe slug for a project within the owner's namespace.</summary>
    /// <param name="name">The project name to base the slug on.</param>
    /// <param name="ownerId">The owner's user ID.</param>
    /// <returns>A unique slug string.</returns>
    Task<string> GenerateProjectSlugAsync(string name, int ownerId);
}
