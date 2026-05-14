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

        public ReactionService(IReactionRepository reactionRepo,
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

        public async Task<ReactionDTO> UpsertReactionAsync(CreateReactionRequest request, int userId)
        {
            // If user already reacted, update emote; otherwise create new.
            var existing = await _reactionRepo.GetUserReactionAsync(userId, request.StackItemType, request.StackItemId);
            if (existing is not null)
            {
                existing.Emote = request.Emote;
                _reactionRepo.Update(existing);
                await _reactionRepo.SaveChangesAsync();
                return _mapper.Map(existing, null!);
            }

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

        public async Task RemoveReactionAsync(int reactionId, int userId)
        {
            var reaction = await _reactionRepo.GetByIdAsync(reactionId);
            if (reaction is null || reaction.UserId != userId)
                throw new InvalidOperationException("Reaction not found or not yours.");
            await _reactionRepo.DeleteByIdAsync(reactionId);
        }
    }
}