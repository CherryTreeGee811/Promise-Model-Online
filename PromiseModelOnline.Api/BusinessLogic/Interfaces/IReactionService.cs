using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IReactionService
    {
        Task<IEnumerable<ReactionDTO>> GetReactionsAsync(string stackItemType, int stackItemId);
        Task<ReactionDTO> UpsertReactionAsync(CreateReactionRequest request, int userId);
        Task RemoveReactionAsync(int reactionId, int userId);
    }
}