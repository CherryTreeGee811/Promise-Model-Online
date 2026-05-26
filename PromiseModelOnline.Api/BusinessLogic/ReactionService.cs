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
    public class ReactionService : IReactionService
    {
        private readonly IReactionRepository _reactionRepo;
        private readonly IGenericMapper<Reaction, ReactionDTO> _mapper;

        public ReactionService(
            IReactionRepository reactionRepo,
            IGenericMapper<Reaction, ReactionDTO> mapper)
        {
            _reactionRepo = reactionRepo;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ReactionDTO>> GetReactionsAsync(string stackItemType, int stackItemId)
        {
            var reactions = await _reactionRepo.GetReactionsForItemAsync(stackItemType, stackItemId);
            return reactions.Select(r => _mapper.Map(r, null!));
        }

        public async Task<ReactionDTO> CreateReactionAsync(CreateReactionRequest request, int userId)
        {
            var existing = await _reactionRepo.GetUserReactionAsync(userId, request.StackItemType, request.StackItemId);

            if (existing is not null)
                throw new InvalidOperationException();

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

        public async Task<ReactionDTO> UpdateReactionAsync(int reactionId, UpdateReactionRequestDTO request, int userId)
        {
            var existing = await _reactionRepo.GetByIdAsync(reactionId);

            if (existing is null || existing.UserId != userId)
                throw new InvalidOperationException();

            if (string.IsNullOrWhiteSpace(request?.Emote))
                throw new InvalidOperationException();

            existing.Emote = request.Emote;

            _reactionRepo.Update(existing);
            await _reactionRepo.SaveChangesAsync();

            return _mapper.Map(existing, null!);
        }

        public async Task RemoveReactionAsync(int reactionId, int userId)
        {
            var reaction = await _reactionRepo.GetByIdAsync(reactionId);

            if (reaction is null || reaction.UserId != userId)
                throw new InvalidOperationException();

            await _reactionRepo.DeleteByIdAsync(reactionId);
        }

        // ✅ Resolve project from stack item
        public async Task<int> GetProjectIdAsync(string stackItemType, int stackItemId)
        {
            var projectId = await _reactionRepo.GetProjectIdAsync(stackItemType, stackItemId);

            if (projectId == null)
                throw new KeyNotFoundException();

            return projectId.Value;
        }

        // ✅ Resolve project from reaction ID
        public async Task<int> GetProjectIdByReactionIdAsync(int reactionId)
        {
            var projectId = await _reactionRepo.GetProjectIdByReactionIdAsync(reactionId);

            if (projectId == null)
                throw new KeyNotFoundException();

            return projectId.Value;
        }
    }
}