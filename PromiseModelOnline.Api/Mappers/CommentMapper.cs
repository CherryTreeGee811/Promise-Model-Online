using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;

namespace PromiseModelOnline.Api.Mappers
{
    /// <summary>Maps <see cref="Comment"/> entities to <see cref="CommentDto"/> with recursive reply mapping.</summary>
    /// <remarks>
    ///   Resolves the user name from the navigation property, extracts mentioned user names,
    ///   and recursively maps child replies to maintain the threaded comment structure.
    /// </remarks>
    public class CommentMapper : IGenericMapper<Comment, CommentDto>
    {
        /// <summary>Map a comment entity to a comment DTO, including nested replies.</summary>
        public CommentDto Map(Comment source, IGenericService<Comment> service)
        {
            return new CommentDto
            {
                Id = source.Id,
                Text = source.Text,
                CreatedAt = source.CreatedAt,
                UserName = source.User?.Name ?? "Unknown",
                ParentCommentId = source.ParentCommentId,
                MentionedUsers = source.Mentions?
                    .Select(m => m.MentionedUser?.Name ?? "Unknown")
                    .ToList() ?? new List<string>(),
                Replies = source.Replies?
                    .Select(r => Map(r, service))
                    .ToList() ?? new List<CommentDto>()
            };
        }
    }
}
