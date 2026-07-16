using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IUserRepository"/> supporting search and SSO auto-provisioning.</summary>
/// <remarks>
///   Scoped lifetime. The <see cref="GetOrCreateUserByEmailAsync"/> method is the primary entry
///   point for OAuth/SSO login flows, creating user records on first sign-in and updating
///   display names on subsequent logins.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class UserRepository(PromiseModelOnlineContext context) : GenericRepository<User>(context), IUserRepository
{

    /// <summary>Find users by exact display name match.</summary>
    /// <param name="name">The display name to match. Not null.</param>
    /// <returns>Users whose name matches exactly.</returns>
    public async Task<IEnumerable<User>> GetUsersByNameAsync(string name, CancellationToken cancellationToken = default) => await FindAsync(u => u.Name.ToLower() == name.ToLower(), cancellationToken);

    /// <summary>Find users by exact email address match.</summary>
    /// <param name="email">The email address to look up. Not null.</param>
    /// <returns>Users with the given email.</returns>
    public async Task<IEnumerable<User>> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await FindAsync(u => u.Email == email, cancellationToken);

    /// <summary>Look up a user by their unique URL-safe slug.</summary>
    /// <param name="slug">The user's slug. Not null or empty.</param>
    /// <returns>The matching user, or <c>null</c> if not found.</returns>
    public async Task<User?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) => await _dbSet.FirstOrDefaultAsync(u => u.Slug == slug, cancellationToken);

    /// <summary>Return a user by email or create a new account (SSO auto-provision).</summary>
    /// <remarks>
    ///   If the user already exists and a <paramref name="username"/> is supplied, the display
    ///   name is updated if it still matches the email (indicating an auto-created account that
    ///   has not been customized). A unique slug is generated from the username or email prefix,
    ///   with a numeric suffix to avoid collisions.
    /// </remarks>
    /// <param name="email">The user's email address. Not null.</param>
    /// <param name="username">Optional username for new accounts or to update the display name on existing ones.</param>
    /// <returns>The existing or newly-created user.</returns>
    public async Task<User> GetOrCreateUserByEmailAsync(string email, string? username = null, CancellationToken cancellationToken = default)
    {
        var users = await FindByEmailAsync(email, cancellationToken);
        var existing = users.FirstOrDefault();

        if (existing is not null)
        {
            var modified = false;

            if (!string.IsNullOrEmpty(username))
            {
                if ((existing.Name == existing.Email || existing.Name == existing.Username) && existing.Name != username)
                {
                    existing.Name = username;
                    modified = true;
                }

                if (existing.Username != username)
                {
                    existing.Username = username;
                    modified = true;
                }

                if (string.IsNullOrEmpty(existing.Slug))
                {
                    existing.Slug = username;
                    modified = true;
                }
            }

            if (modified)
            {
                Update(existing);
                await SaveChangesAsync(cancellationToken);
            }

            return existing;
        }

        var baseSlug = username ?? (!string.IsNullOrEmpty(email) && email.Contains('@') ? email.Split('@')[0] : "Unknown");
        var slug = baseSlug;
        var counter = 1;
        while (await _dbSet.AnyAsync(u => u.Slug == slug, cancellationToken))
        {
            slug = $"{baseSlug}_{counter}";
            counter++;
        }

        var user = new User
        {
            Email = email,
            Name = username ?? (!string.IsNullOrEmpty(email) && email.Contains('@') ? email.Split('@')[0] : email),
            Slug = slug,
            Role = UserRole.Professional,
            CreatedAt = DateTime.UtcNow
        };
        await AddAsync(user, cancellationToken);
        try
        {
            await SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            var retryUsers = await FindByEmailAsync(email, cancellationToken);
            var retryUser = retryUsers.FirstOrDefault();
            if (retryUser is not null)
            {
                return retryUser;
            }
            throw;
        }
        return user;
    }

    /// <summary>Search users who are members of a specific project by partial name match.</summary>
    /// <param name="projectId">The project ID to search within. Must be greater than zero.</param>
    /// <param name="searchTerm">Partial display name to match (case-insensitive). Not null.</param>
    /// <param name="maxResults">Maximum results to return, range [1, 50]. Default is 5.</param>
    /// <returns>Matching project members.</returns>
    public async Task<IEnumerable<User>> SearchUsersByProjectAsync(int projectId, string searchTerm, int maxResults = 5, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Enumerable.Empty<User>();

        var project = await _context.Set<Project>().FindAsync(new object[] { projectId }, cancellationToken);
        var ownerId = project?.OwnerId;

        var userIds = await _context.Set<Permission>()
            .Where(p => p.ProjectId == projectId && p.Status == PermissionStatus.Active)
            .Select(p => p.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (ownerId.HasValue && !userIds.Contains(ownerId.Value))
            userIds.Add(ownerId.Value);

        return await _dbSet
            .Where(u => userIds.Contains(u.Id) && u.Name.ToLower().Contains(searchTerm.ToLower()))
            .Take(maxResults)
            .ToListAsync(cancellationToken);
    }

    /// <summary>Global user search by name or email across all projects.</summary>
    /// <param name="searchTerm">Partial name or email to match (case-insensitive). Not null.</param>
    /// <param name="maxResults">Maximum results to return, range [1, 50]. Default is 10.</param>
    /// <returns>Matching users.</returns>
    public async Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, int maxResults = 10, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Enumerable.Empty<User>();

        var lower = searchTerm.ToLower();
        return await _dbSet
            .Where(u => u.Name.ToLower().Contains(lower) || u.Email.ToLower().Contains(lower) || (u.Username != null && u.Username.ToLower().Contains(lower)))
            .Take(maxResults)
            .ToListAsync(cancellationToken);
    }
}
