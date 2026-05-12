using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class CommentRepository : ICommentRepository
    {
        private readonly PromiseModelOnlineContext _context;

        public CommentRepository(PromiseModelOnlineContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comment>> GetCommentsForEntityAsync(string parentType, int parentId)
        {
            IQueryable<Comment> query = _context.Set<Comment>()
                .Include(c => c.User)
                .Include(c => c.Mentions)
                    .ThenInclude(m => m.MentionedUser)
                .Include(c => c.Replies)       // for threading
                    .ThenInclude(r => r.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.Mentions)
                        .ThenInclude(m => m.MentionedUser)
                .Where(c => c.ParentCommentId == null); // top-level comments only

            query = parentType.ToLower() switch
            {
                "promise" => query.Where(c => c.ProductPromiseId == parentId),
                "epic" => query.Where(c => c.EpicId == parentId),
                "journey" => query.Where(c => c.JourneyId == parentId),
                "flow" => query.Where(c => c.FlowId == parentId),
                "moment" => query.Where(c => c.MomentId == parentId),
                _ => throw new ArgumentException("Invalid parent type")
            };

            return await query.OrderBy(c => c.CreatedAt).ToListAsync();
        }

        public async Task AddCommentAsync(Comment comment)
        {
            await _context.Set<Comment>().AddAsync(comment);
            await _context.SaveChangesAsync();
        }

        public async Task AddMentionAsync(CommentMention mention)
        {
            await _context.Set<CommentMention>().AddAsync(mention);
            await _context.SaveChangesAsync();
        }
    }
}