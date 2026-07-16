using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for Comment business logic with DTO mapping and mention tracking.</summary>
/// <remarks>
///   Handles comment retrieval with threaded replies, creation with mention parsing and user
///   notification dispatch. Scoped lifetime.
/// </remarks>
public interface ICommentService
{
    /// <summary>Return all comments for a parent entity as DTOs with threaded replies.</summary>
    /// <param name="parentType">Entity type discriminator (<c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, <c>"moment"</c>).</param>
    /// <param name="parentId">The parent entity's ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Comment DTOs with user, mentions, and nested replies.</returns>
    Task<IEnumerable<CommentDto>> GetCommentsAsync(string parentType, int parentId, CancellationToken cancellationToken = default);

    /// <summary>Create a new comment with mention detection and notification dispatch.</summary>
    /// <param name="dto">The creation data (parent type, parent ID, body). Not null.</param>
    /// <param name="userId">The author's user ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created comment DTO.</returns>
    Task<CommentDto> CreateCommentAsync(CreateCommentDto dto, int userId, CancellationToken cancellationToken = default);
}
