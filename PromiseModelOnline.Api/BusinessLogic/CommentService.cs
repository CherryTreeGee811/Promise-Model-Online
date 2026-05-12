using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepo;
        private readonly IUserRepository _userRepo;
        private readonly IGenericMapper<Comment, CommentDTO> _mapper;
        private readonly INotificationService _notificationService;

        public CommentService(
            ICommentRepository commentRepo,
            IUserRepository userRepo,
            IGenericMapper<Comment, CommentDTO> mapper,
            INotificationService notificationService)
        {
            _commentRepo = commentRepo;
            _userRepo = userRepo;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<CommentDTO>> GetCommentsAsync(string parentType, int parentId)
        {
            var comments = await _commentRepo.GetCommentsForEntityAsync(parentType, parentId);
            return comments.Select(c => _mapper.Map(c, null!)).ToList();
        }

        public async Task<CommentDTO> CreateCommentAsync(CreateCommentDTO dto, int userId)
        {
            var comment = new Comment
            {
                Text = dto.Text,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                ParentCommentId = dto.ParentCommentId
            };

            switch (dto.ParentType.ToLower())
            {
                case "promise":  comment.ProductPromiseId = dto.ParentId; break;
                case "epic":     comment.EpicId = dto.ParentId; break;
                case "journey":  comment.JourneyId = dto.ParentId; break;
                case "flow":     comment.FlowId = dto.ParentId; break;
                case "moment":   comment.MomentId = dto.ParentId; break;
                default: throw new ArgumentException("Invalid parent type");
            }

            await _commentRepo.AddCommentAsync(comment);

            var mentions = Regex.Matches(dto.Text, @"@(\w+)")
                                .Select(m => m.Groups[1].Value)
                                .Distinct();
            foreach (var mentionedUsername in mentions)
            {
                var mentionedUsers = await _userRepo.GetUsersByNameAsync(mentionedUsername);
                var mentionedUser = mentionedUsers.FirstOrDefault();
                if (mentionedUser != null)
                {
                    await _commentRepo.AddMentionAsync(new CommentMention
                    {
                        CommentId = comment.Id,
                        MentionedUserId = mentionedUser.Id
                    });

                    await _notificationService.CreateNotificationAsync(
                        mentionedUser.Id,
                        NotificationType.Mention,
                        $"You were mentioned in a comment by user {userId}",
                        $"/moments/{dto.ParentId}?type={dto.ParentType}"
                    );
                }
            }

            var createdComments = await _commentRepo.GetCommentsForEntityAsync(dto.ParentType, dto.ParentId);
            var created = createdComments.First(c => c.Id == comment.Id);
            return _mapper.Map(created, null!);
        }
    }
}