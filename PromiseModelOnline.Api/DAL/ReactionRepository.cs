using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class ReactionRepository : GenericRepository<Reaction>, IReactionRepository
    {
        public ReactionRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Reaction>> GetReactionsForItemAsync(string stackItemType, int stackItemId)
        {
            return await _dbSet
                .Include(r => r.User)
                .Where(r => r.StackItemType == stackItemType && r.StackItemId == stackItemId)
                .ToListAsync();
        }

        public async Task<Reaction?> GetUserReactionAsync(int userId, string stackItemType, int stackItemId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(r => r.UserId == userId && r.StackItemType == stackItemType && r.StackItemId == stackItemId);
        }
    }
}