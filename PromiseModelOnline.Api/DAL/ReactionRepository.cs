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

        public async Task<int?> GetProjectIdAsync(string stackItemType, int stackItemId)
        {
            // Example logic — adapt to your schema
            switch (stackItemType.ToLower())
            {
                case "promise":
                    return await _context.Promises
                        .Where(p => p.Id == stackItemId)
                        .Select(p => (int?)p.ProjectId)
                        .FirstOrDefaultAsync();

                case "epic":
                    return await _context.Epics
                        .Where(e => e.Id == stackItemId)
                        .Select(e => (int?)e.ProductPromise.ProjectId)
                        .FirstOrDefaultAsync();

                default:
                    return null;
            }
        }

        public async Task<int?> GetProjectIdByReactionIdAsync(int reactionId)
        {
            var reaction = await _context.Reactions
                .Where(r => r.Id == reactionId)
                .Select(r => new { r.StackItemType, r.StackItemId })
                .FirstOrDefaultAsync();

            if (reaction == null)
                return null;

            return await GetProjectIdAsync(reaction.StackItemType, reaction.StackItemId);
        }
    }
}