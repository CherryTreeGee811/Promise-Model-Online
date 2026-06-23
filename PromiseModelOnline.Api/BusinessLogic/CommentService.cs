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

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Comment"/> entities with mention detection and notifications.</summary>
/// <remarks>
///   Handles threaded comment retrieval with DTO mapping, comment creation with parent-type
///   routing, @-mention detection via regex, and user notification dispatch for mentions.
///   Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with required dependencies.</remarks>
public class CommentService(
    ICommentRepository commentRepo,
    IUserRepository userRepo,
    IGenericMapper<Comment, CommentDto> mapper,
    INotificationService notificationService) : ICommentService
{
    private readonly ICommentRepository _commentRepo = commentRepo;
    private readonly IUserRepository _userRepo = userRepo;
    private readonly IGenericMapper<Comment, CommentDto> _mapper = mapper;
    private readonly INotificationService _notificationService = notificationService;

    /// <summary>Return all comments for a parent entity as DTOs with threaded replies.</summary>
    /// <param name="parentType">Entity type discriminator (<c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, <c>"moment"</c>).</param>
    /// <param name="parentId">The parent entity's ID.</param>
    /// <returns>Comment DTOs mapped from entities.</returns>
    public async Task<IEnumerable<CommentDto>> GetCommentsAsync(string parentType, int parentId)
    {
        var comments = await _commentRepo.GetCommentsForEntityAsync(parentType, parentId);
        return comments.Select(c => _mapper.Map(c, null!)).ToList();
    }

    /// <summary>Create a new comment with mention detection and notification dispatch.</summary>
    /// <remarks>
    ///   Routes the comment to the correct parent foreign key based on <paramref name="dto"/>.<c>ParentType</c>.
    ///   Parses @-mentions from the comment text, records them, and sends mention notifications.
    /// </remarks>
    /// <param name="dto">The creation data. Not null.</param>
    /// <param name="userId">The author's user ID.</param>
    /// <returns>The created comment DTO.</returns>
    public async Task<CommentDto> CreateCommentAsync(CreateCommentDto dto, int userId)
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
            case "promise": comment.ProductPromiseId = dto.ParentId; break;
            case "epic": comment.EpicId = dto.ParentId; break;
            case "journey": comment.JourneyId = dto.ParentId; break;
            case "flow": comment.FlowId = dto.ParentId; break;
            case "moment": comment.MomentId = dto.ParentId; break;
            default: throw new ArgumentException("Invalid parent type");
        }

        await _commentRepo.AddCommentAsync(comment);

        var currentUser = await _userRepo.GetByIdAsync(userId);
        var currentUserName = currentUser?.Name ?? "Unknown";

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
                    $"You were mentioned in a comment by {currentUserName}",
                    $"/moments/{dto.ParentId}?type={dto.ParentType}"
                );
            }
        }

        var createdComments = await _commentRepo.GetCommentsForEntityAsync(dto.ParentType, dto.ParentId);
        var created = createdComments.First(c => c.Id == comment.Id);
        return _mapper.Map(created, null!);
    }
}
