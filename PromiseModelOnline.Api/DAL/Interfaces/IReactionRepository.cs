using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IReactionRepository : IGenericRepository<Reaction>
    {
        Task<IEnumerable<Reaction>> GetReactionsForItemAsync(string stackItemType, int stackItemId);
        Task<Reaction?> GetUserReactionAsync(int userId, string stackItemType, int stackItemId);
    }
}