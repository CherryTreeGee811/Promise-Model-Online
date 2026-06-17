using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Business logic for <see cref="Reaction"/> entities with ownership enforcement.</summary>
    /// <remarks>
    ///   Handles toggle-style reactions on stack items with user ownership validation for update
    ///   and delete operations. Prevents duplicate reactions from the same user on the same item.
    ///   Scoped lifetime.
    /// </remarks>
    public class ReactionService : IReactionService
    {
        private readonly IReactionRepository _reactionRepo;
        private readonly IGenericMapper<Reaction, ReactionDto> _mapper;

        /// <param name="reactionRepo">Repository for reaction data access.</param>
        /// <param name="mapper">Mapper for reaction to DTO conversion.</param>
        public ReactionService(IReactionRepository reactionRepo,
                               IGenericMapper<Reaction, ReactionDto> mapper)
        {
            _reactionRepo = reactionRepo;
            _mapper = mapper;
        }

        /// <summary>Return all reactions on a stack item as DTOs.</summary>
        /// <param name="stackItemType">The target entity type.</param>
        /// <param name="stackItemId">The target entity ID.</param>
        /// <returns>Reaction DTOs with user information.</returns>
        public async Task<IEnumerable<ReactionDto>> GetReactionsAsync(string stackItemType, int stackItemId)
        {
            var reactions = await _reactionRepo.GetReactionsForItemAsync(stackItemType, stackItemId);
            return reactions.Select(r => _mapper.Map(r, null!));
        }

        /// <summary>Add a reaction to a stack item.</summary>
        /// <param name="request">The reaction details.</param>
        /// <param name="userId">The user ID.</param>
        /// <returns>The created reaction DTO.</returns>
        /// <exception cref="InvalidOperationException">Reaction already exists for this user and item.</exception>
        public async Task<ReactionDto> CreateReactionAsync(CreateReactionRequest request, int userId)
        {
            var existing = await _reactionRepo.GetUserReactionAsync(userId, request.StackItemType, request.StackItemId);
            if (existing is not null)
                throw new InvalidOperationException("Reaction already exists for this user and item.");

            var reaction = new Reaction
            {
                UserId = userId,
                Emote = request.Emote,
                StackItemType = request.StackItemType,
                StackItemId = request.StackItemId,
                CreatedAt = DateTime.UtcNow
            };
            await _reactionRepo.AddAsync(reaction);
            await _reactionRepo.SaveChangesAsync();
            return _mapper.Map(reaction, null!);
        }

        /// <summary>Update an existing reaction's emote with ownership validation.</summary>
        /// <param name="reactionId">The reaction ID.</param>
        /// <param name="request">The updated reaction details.</param>
        /// <param name="userId">The requesting user ID for ownership validation.</param>
        /// <returns>The updated reaction DTO.</returns>
        /// <exception cref="InvalidOperationException">Reaction not found, not owned by user, or emote is empty.</exception>
        public async Task<ReactionDto> UpdateReactionAsync(int reactionId, UpdateReactionRequestDto request, int userId)
        {
            var existing = await _reactionRepo.GetByIdAsync(reactionId);
            if (existing is null || existing.UserId != userId)
                throw new InvalidOperationException("Reaction not found or not yours.");

            if (string.IsNullOrWhiteSpace(request?.Emote))
                throw new InvalidOperationException("Emote is required.");

            existing.Emote = request.Emote;
            _reactionRepo.Update(existing);
            await _reactionRepo.SaveChangesAsync();
            return _mapper.Map(existing, null!);
        }

        /// <summary>Remove a reaction with ownership validation.</summary>
        /// <param name="reactionId">The reaction ID to remove.</param>
        /// <param name="userId">The requesting user ID for ownership validation.</param>
        /// <exception cref="InvalidOperationException">Reaction not found or not owned by user.</exception>
        public async Task RemoveReactionAsync(int reactionId, int userId)
        {
            var reaction = await _reactionRepo.GetByIdAsync(reactionId);
            if (reaction is null || reaction.UserId != userId)
                throw new InvalidOperationException("Reaction not found or not yours.");
            await _reactionRepo.DeleteByIdAsync(reactionId);
        }
    }
}