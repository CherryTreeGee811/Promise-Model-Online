using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface ICommentService
    {
        Task<IEnumerable<CommentDTO>> GetCommentsAsync(string parentType, int parentId);
        Task<CommentDTO> CreateCommentAsync(CreateCommentDTO dto, int userId);
    }
}