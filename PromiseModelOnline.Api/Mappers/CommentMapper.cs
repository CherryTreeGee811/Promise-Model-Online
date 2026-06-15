using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;

namespace PromiseModelOnline.Api.Mappers
{
        /// <param name="service">The service for resolving related data.</param>
    /// <summary>Maps <see cref="Comment"/> entities to <see cref="CommentDTO"/> with recursive reply mapping.</summary>
        /// <param name="source">The source entity to map.</param>
    /// <remarks>
    ///   Resolves the user name from the navigation property, extracts mentioned user names,
    ///   and recursively maps child replies to maintain the threaded comment structure.
    /// </remarks>
    public class CommentMapper : IGenericMapper<Comment, CommentDTO>
    {
        /// <summary>Map a comment entity to a comment DTO, including nested replies.</summary>
        public CommentDTO Map(Comment source, IGenericService<Comment> service)
        {
            return new CommentDTO
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
                    .ToList() ?? new List<CommentDTO>()
            };
        }
    }
}
