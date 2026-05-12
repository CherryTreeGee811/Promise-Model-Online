using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;

namespace PromiseModelOnline.Api.Mappers
{
    public class CommentMapper : IGenericMapper<Comment, CommentDTO>
    {
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