using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface ICommentRepository
    {
        Task<IEnumerable<Comment>> GetCommentsForEntityAsync(string parentType, int parentId);
        Task AddCommentAsync(Comment comment);
        Task AddMentionAsync(CommentMention mention);
    }
}