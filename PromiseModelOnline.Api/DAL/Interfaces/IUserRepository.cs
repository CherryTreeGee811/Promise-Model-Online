using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="User"/> entities with search and auto-provisioning.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with name/email lookups, SSO/OAuth
///   auto-provisioning via <see cref="GetOrCreateUserByEmailAsync"/>, project-scoped member
///   search, and global user search. Scoped lifetime.
/// </remarks>
public interface IUserRepository : IGenericRepository<User>
{
    /// <summary>Find users by exact display name match.</summary>
    /// <param name="name">The display name to match. Not null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Users whose name matches exactly.</returns>
    Task<IEnumerable<User>> GetUsersByNameAsync(string name, CancellationToken cancellationToken = default);

    /// <summary>Find users by exact email address match.</summary>
    /// <param name="email">The email address to look up. Not null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Users with the given email.</returns>
    Task<IEnumerable<User>> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Return a user by email or create a new account (SSO auto-provision).</summary>
    /// <remarks>
    ///   If the user already exists and a <paramref name="username"/> is provided, the user's
    ///   display name is updated if it was still set to the email (indicating an uncustomized
    ///   auto-created account). A unique slug is generated from the username or email prefix.
    ///   This method is the primary entry point for OAuth/SSO login flows.
    /// </remarks>
    /// <param name="email">The user's email address. Not null.</param>
    /// <param name="username">Optional username for new accounts or to update existing.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The existing or newly-created user.</returns>
    Task<User> GetOrCreateUserByEmailAsync(string email, string? username = null, CancellationToken cancellationToken = default);

    /// <summary>Search users who are members of a specific project.</summary>
    /// <param name="projectId">The project ID to search within. Must be greater than zero.</param>
    /// <param name="searchTerm">Partial name to match (case-insensitive). Not null.</param>
    /// <param name="maxResults">Maximum results to return, range [1, 50]. Default is 5.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Matching project members.</returns>
    Task<IEnumerable<User>> SearchUsersByProjectAsync(int projectId, string searchTerm, int maxResults = 5, CancellationToken cancellationToken = default);

    /// <summary>Global user search by name or email across all projects.</summary>
    /// <param name="searchTerm">Partial name or email to match (case-insensitive). Not null.</param>
    /// <param name="maxResults">Maximum results to return, range [1, 50]. Default is 10.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Matching users.</returns>
    Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, int maxResults = 10, CancellationToken cancellationToken = default);

    /// <summary>Look up a user by their unique URL-safe slug.</summary>
    /// <param name="slug">The user's slug. Not null or empty.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The matching user, or <c>null</c> if not found.</returns>
    Task<User?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
}
