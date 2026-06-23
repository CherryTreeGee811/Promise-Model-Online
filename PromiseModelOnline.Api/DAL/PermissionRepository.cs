using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IPermissionRepository"/> for user-project access management.</summary>
/// <remarks>
///   Scoped lifetime. Some queries eagerly load related entities (<see cref="Permission.User"/>,
///   <see cref="Permission.Project"/>) to avoid N+1 in the UI.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class PermissionRepository(PromiseModelOnlineContext context) : GenericRepository<Permission>(context), IPermissionRepository
{

    /// <summary>Return all permission records for a project with user details.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>Permission records with <see cref="Permission.User"/> eagerly loaded.</returns>
    public async Task<IEnumerable<Permission>> GetPermissionsByProjectAsync(int projectId) => await _context.Set<Permission>()
            .Include(p => p.User)
            .Where(p => p.ProjectId == projectId)
            .ToListAsync();

    /// <summary>Return all pending (unaccepted) invitations for a user.</summary>
    /// <param name="userId">The invited user's ID. Must be greater than zero.</param>
    /// <returns>Pending invitations with <see cref="Permission.Project"/> eagerly loaded.</returns>
    public async Task<IEnumerable<Permission>> GetPendingInvitationsForUserAsync(int userId) => await _dbSet
            .Include(p => p.Project)
            .Where(p => p.UserId == userId && p.Status == PermissionStatus.Pending)
            .ToListAsync();

    /// <summary>Look up a specific user's permission on a specific project.</summary>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>The permission record, or <c>null</c> if the user has no access.</returns>
    public async Task<Permission?> GetByUserAndProjectAsync(int userId, int projectId) => await _dbSet
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ProjectId == projectId);

    /// <summary>Return all project IDs the user has active access to.</summary>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <returns>Distinct project IDs where the user's permission status is <c>Active</c>.</returns>
    public async Task<IEnumerable<int>> GetProjectIdsForUserAsync(int userId) => await _dbSet
            .Where(p => p.UserId == userId && p.Status == PermissionStatus.Active)
            .Select(p => p.ProjectId)
            .Distinct()
            .ToListAsync();
}
