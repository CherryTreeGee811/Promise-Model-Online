using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    /// <summary>Repository for <see cref="Reaction"/> entities with per-item and per-user lookups.</summary>
    /// <remarks>
    ///   Extends <see cref="IGenericRepository{T}"/> with queries to retrieve all reactions for a
    ///   stack item (for display) and to find a specific user's reaction (for toggle logic).
    ///   Scoped lifetime.
    /// </remarks>
    public interface IReactionRepository : IGenericRepository<Reaction>
    {
        /// <summary>Return all reactions on a specific stack item.</summary>
        /// <remarks>
        ///   Eagerly loads the <see cref="Reaction.User"/> navigation property. The
        ///   <paramref name="stackItemType"/> discriminates which entity type the reaction targets
        ///   (e.g., <c>"moment"</c>, <c>"flow"</c>, <c>"comment"</c>).
        /// </remarks>
        /// <param name="stackItemType">Type of the target entity. Not null.</param>
        /// <param name="stackItemId">The target entity's ID. Must be greater than zero.</param>
        /// <returns>All reactions on the given item with user information.</returns>
        Task<IEnumerable<Reaction>> GetReactionsForItemAsync(string stackItemType, int stackItemId);

        /// <summary>Return a specific user's reaction on a specific stack item.</summary>
        /// <remarks>
        ///   Used to determine whether the user has already reacted (toggle add/remove).
        /// </remarks>
        /// <param name="userId">The user ID. Must be greater than zero.</param>
        /// <param name="stackItemType">Type of the target entity. Not null.</param>
        /// <param name="stackItemId">The target entity's ID. Must be greater than zero.</param>
        /// <returns>The user's reaction, or <c>null</c> if they have not reacted.</returns>
        Task<Reaction?> GetUserReactionAsync(int userId, string stackItemType, int stackItemId);
    }
}
