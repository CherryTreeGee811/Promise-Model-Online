<<<<<<< HEAD
using PromiseModelOnline.Api.DTOs;
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
        Task<IEnumerable<StackSearchResult>> SearchStackByStatementAsync(int projectId, string searchTerm, int maxResults = 5);
        Task<int> ResolveProjectIdAsync(string parentType, int parentId);
        Task<IEnumerable<Promise>> GetPromisesByProjectAsync(int projectId);
        Task<IEnumerable<Epic>> GetEpicsByPromiseIdsAsync(List<int> promiseIds);
        Task<IEnumerable<Journey>> GetJourneysByEpicIdsAsync(List<int> epicIds);
        Task<IEnumerable<Flow>> GetFlowsByJourneyIdsAsync(List<int> journeyIds);
        Task<IEnumerable<Moment>> GetMomentsByFlowIdsAsync(List<int> flowIds);
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}