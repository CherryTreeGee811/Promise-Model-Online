using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>Service for Reaction business logic with toggle-style add/update/remove.</summary>
    /// <remarks>
    ///   Handles emoji-style reactions on stack items (moments, flows, comments, etc.).
    ///   Provides get, create, update, and remove operations with user ownership validation.
    ///   Scoped lifetime.
    /// </remarks>
    public interface IReactionService
    {
        /// <summary>Return all reactions on a stack item.</summary>
        /// <param name="stackItemType">The target entity type (e.g., <c>"moment"</c>, <c>"flow"</c>).</param>
        /// <param name="stackItemId">The target entity's ID.</param>
        /// <returns>Reaction DTOs with user information.</returns>
        Task<IEnumerable<ReactionDTO>> GetReactionsAsync(string stackItemType, int stackItemId);

        /// <summary>Add a reaction to a stack item.</summary>
        /// <param name="request">The reaction details (type, item, emoji).</param>
        /// <param name="userId">The user ID placing the reaction.</param>
        /// <returns>The created reaction DTO.</returns>
        Task<ReactionDTO> CreateReactionAsync(CreateReactionRequest request, int userId);

        /// <summary>Update an existing reaction.</summary>
        /// <param name="reactionId">The reaction ID to update.</param>
        /// <param name="request">The updated reaction details.</param>
        /// <param name="userId">The requesting user ID for ownership validation.</param>
        /// <returns>The updated reaction DTO.</returns>
        Task<ReactionDTO> UpdateReactionAsync(int reactionId, UpdateReactionRequestDTO request, int userId);

        /// <summary>Remove a reaction.</summary>
        /// <param name="reactionId">The reaction ID to remove.</param>
        /// <param name="userId">The requesting user ID for ownership validation.</param>
        Task RemoveReactionAsync(int reactionId, int userId);
    }
}
