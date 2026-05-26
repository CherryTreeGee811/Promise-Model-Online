using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IReactionService
    {
        Task<IEnumerable<ReactionDTO>> GetReactionsAsync(string stackItemType, int stackItemId);

        Task<ReactionDTO> CreateReactionAsync(CreateReactionRequest request, int userId);

        Task<ReactionDTO> UpdateReactionAsync(int reactionId, UpdateReactionRequestDTO request, int userId);

        Task RemoveReactionAsync(int reactionId, int userId);

        // ✅ NEW (for permission enforcement)
        Task<int> GetProjectIdAsync(string stackItemType, int stackItemId);

        Task<int> GetProjectIdByReactionIdAsync(int reactionId);
    }
}