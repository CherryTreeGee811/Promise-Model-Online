using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IReactionRepository"/> for emoji-style reactions on stack items.</summary>
/// <remarks>
///   Scoped lifetime. Uses <c>StackItemType</c> and <c>StackItemId</c> as a polymorphic foreign
///   key to support reactions on any entity type (moment, flow, comment, etc.).
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class ReactionRepository(PromiseModelOnlineContext context) : GenericRepository<Reaction>(context), IReactionRepository
{

    /// <summary>Return all reactions on a specific stack item with user details.</summary>
    /// <param name="stackItemType">The type of the target entity (e.g., <c>"moment"</c>, <c>"flow"</c>). Not null.</param>
    /// <param name="stackItemId">The target entity's ID. Must be greater than zero.</param>
    /// <returns>Reactions with <see cref="Reaction.User"/> eagerly loaded.</returns>
    public async Task<IEnumerable<Reaction>> GetReactionsForItemAsync(string stackItemType, int stackItemId, CancellationToken cancellationToken = default) => await _dbSet
            .Include(r => r.User)
            .Where(r => r.StackItemType == stackItemType && r.StackItemId == stackItemId)
            .ToListAsync(cancellationToken);

    /// <summary>Return a specific user's reaction on a specific stack item.</summary>
    /// <remarks>
    ///   Used by the toggle logic: if a reaction exists, remove it; otherwise add one.
    /// </remarks>
    /// <param name="userId">The user ID. Must be greater than zero.</param>
    /// <param name="stackItemType">The type of the target entity. Not null.</param>
    /// <param name="stackItemId">The target entity's ID. Must be greater than zero.</param>
    /// <returns>The user's reaction, or <c>null</c> if they have not reacted.</returns>
    public async Task<Reaction?> GetUserReactionAsync(int userId, string stackItemType, int stackItemId, CancellationToken cancellationToken = default) => await _dbSet
            .FirstOrDefaultAsync(r => r.UserId == userId && r.StackItemType == stackItemType && r.StackItemId == stackItemId, cancellationToken);
}
