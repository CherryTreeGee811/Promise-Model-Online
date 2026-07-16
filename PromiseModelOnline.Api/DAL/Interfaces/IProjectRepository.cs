using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Project"/> entities with ownership and slug queries.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with lookups specific to project ownership
///   (by user ID), the canonical public slug pair (<c>ownerSlug</c> + <c>projectSlug</c>),
///   and traversal to top-level product promises. Scoped; one instance per request.
/// </remarks>
public interface IProjectRepository : IGenericRepository<Project>
{
    /// <summary>Return all projects owned by a specific user.</summary>
    /// <param name="userId">The owner's integer user ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The collection of projects where <c>OwnerId == userId</c>. 
    ///   Empty enumeration if the user has no projects.</returns>
    Task<IEnumerable<Project>> GetProjectsOwnedByUserAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>Return projects matching the given IDs, with Owner loaded.</summary>
    /// <param name="ids">The project IDs to fetch. Must be non-null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Projects whose <c>Id</c> is in <paramref name="ids"/>, with <c>Owner</c> populated.</returns>
    Task<IEnumerable<Project>> GetProjectsByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);

    /// <summary>Return the top-level product promises for a project.</summary>
    /// <remarks>
    ///   Navigates the <see cref="Project.ProductPromises"/> navigation property and orders
    ///   results by <see cref="Promise.DisplayOrder"/>.
    /// </remarks>
    /// <param name="projectId">The project's integer ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All top-level promises belonging to the project, ordered by display order.</returns>
    Task<IEnumerable<Promise>> GetProductPromisesByProjectAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>Look up a project by its owner-slug and project-slug pair.</summary>
    /// <remarks>
    ///   This is the canonical public identifier used in URLs. The query eagerly includes
    ///   the <see cref="Project.Owner"/> navigation property so both slugs can be evaluated
    ///   in a single round-trip.
    /// </remarks>
    /// <param name="ownerSlug">URL-safe slug of the project owner (from <see cref="User.Slug"/>).
    ///   Case-sensitive. Not null.</param>
    /// <param name="projectSlug">URL-safe slug of the project (from <see cref="Project.Slug"/>).
    ///   Case-sensitive. Not null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The matching <see cref="Project"/> with its <see cref="Project.Owner"/> populated,
    ///   or <c>null</c> if no such project exists.</returns>
    Task<Project?> GetByOwnerAndSlugAsync(string ownerSlug, string projectSlug, CancellationToken cancellationToken = default);
}
