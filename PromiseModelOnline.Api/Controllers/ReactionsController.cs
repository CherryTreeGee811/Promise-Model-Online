using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for emoji-style reactions on stack items.</summary>
/// <remarks>
///   Provides CRUD for reactions with user ownership validation.
///   Requires <c>projects.read</c> for reads and <c>projects.write</c> for mutations.
/// </remarks>
/// <param name="logger">The logger for audit and error events.</param>
/// <param name="reactionService">The service for reaction operations.</param>
/// <param name="userRepository">The repository for user data access.</param>
/// <param name="commentRepository">The repository for comment operations (used for project resolution).</param>
/// <param name="permissionService">The permission service for project-level authorization.</param>
/// <param name="reactionRepository">The repository for reaction data access.</param>
[Route("api/reactions")]
#pragma warning disable S4502 // CSRF not applicable — API controller uses JWT Bearer token authentication; compensating controls: CORS whitelist + projects.read/write authorization policies
[IgnoreAntiforgeryToken]
#pragma warning restore S4502
public class ReactionsController(IReactionService reactionService,
                           IUserRepository userRepository,
                           ICommentRepository commentRepository,
                           IPermissionService permissionService,
                           IReactionRepository reactionRepository,
                           ILogger<ReactionsController> logger) : ControllerBase
{
    private readonly IReactionService _reactionService = reactionService;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly ICommentRepository _commentRepository = commentRepository;
    private readonly IPermissionService _permissionService = permissionService;
    private readonly IReactionRepository _reactionRepository = reactionRepository;
    private readonly ILogger<ReactionsController> _logger = logger;



    /// <summary>Get all reactions for a stack item.</summary>
    /// <param name="type">The entity type discriminator.</param>
    /// <param name="itemId">The item ID.</param>
    /// <returns>A list of reaction DTOs.</returns>

    [Authorize(Policy = "projects.read")]

    [HttpGet]

    public async Task<ActionResult<IEnumerable<ReactionDto>>> GetReactions(

        [FromQuery] string type, [FromQuery] int itemId)

    {

        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var reactions = await _reactionService.GetReactionsAsync(type, itemId);

        return Ok(reactions);

    }



    /// <summary>Add a reaction to a stack item.</summary>
    /// <param name="request">The reaction creation data.</param>
    /// <returns>The created reaction DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost]
    public async Task<ActionResult<ReactionDto>> CreateReaction([FromBody] CreateReactionRequest request)
    {
        if (request is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var userId = await GetCurrentUserIdAsync();
        if (userId is null) return Unauthorized();

        int projectId;
        try { projectId = await _commentRepository.ResolveProjectIdAsync(request.StackItemType, request.StackItemId); }
        catch (ArgumentException) { return NotFound("Stack item not found."); }
        var level = await _permissionService.GetUserPermissionAsync(userId.Value, projectId);
        if (level == null || level < PermissionLevel.Comment) return Forbid();

        try
        {
            var result = await _reactionService.CreateReactionAsync(request, userId.Value);
            _logger.LogInformation("User {UserId} created reaction {ReactionId}", userId.Value, result.Id);
            return CreatedAtAction(nameof(GetReactions), new { type = request.StackItemType, itemId = request.StackItemId }, result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "CreateReaction failed for user {UserId}", userId);
            return BadRequest("The reaction could not be created.");
        }
    }

    /// <summary>Update an existing reaction's emote.</summary>
    /// <param name="id">The reaction ID.</param>
    /// <param name="request">The update request data.</param>
    /// <returns>The updated reaction DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPatch("{id}")]
    public async Task<ActionResult<ReactionDto>> UpdateReaction(int id, [FromBody] UpdateReactionRequestDto request)
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId is null) return Unauthorized();
        if (request is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var reaction = await _reactionRepository.GetByIdAsync(id);
        if (reaction is null) return NotFound("Reaction not found.");

        int projectId;
        try { projectId = await _commentRepository.ResolveProjectIdAsync(reaction.StackItemType, reaction.StackItemId); }
        catch (ArgumentException) { return NotFound("Stack item not found."); }
        var level = await _permissionService.GetUserPermissionAsync(userId.Value, projectId);
        if (level == null || level < PermissionLevel.Comment) return Forbid();

        try
        {
            var result = await _reactionService.UpdateReactionAsync(id, request, userId.Value);
            _logger.LogInformation("User {UserId} updated reaction {ReactionId}", userId.Value, id);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "UpdateReaction {ReactionId} failed for user {UserId}", id, userId);
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound("Reaction not found.");
            return BadRequest("The reaction could not be updated.");
        }
    }

    /// <summary>Remove a reaction.</summary>
    /// <param name="id">The entity ID.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteReaction(int id)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var userId = await GetCurrentUserIdAsync();
        if (userId == null) return Unauthorized();

        var reaction = await _reactionRepository.GetByIdAsync(id);
        if (reaction is null) return NotFound("Reaction not found.");

        int projectId;
        try { projectId = await _commentRepository.ResolveProjectIdAsync(reaction.StackItemType, reaction.StackItemId); }
        catch (ArgumentException) { return NotFound("Stack item not found."); }
        var level = await _permissionService.GetUserPermissionAsync(userId.Value, projectId);
        if (level == null || level < PermissionLevel.Comment) return Forbid();

        try
        {
            await _reactionService.RemoveReactionAsync(id, userId.Value);
            _logger.LogInformation("User {UserId} deleted reaction {ReactionId}", userId.Value, id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete reaction {ReactionId} by user {UserId}", id, userId.Value);
            return BadRequest("Cannot remove reaction.");
        }
    }



    /// <summary>Resolve the current user ID from JWT claims.</summary>

    private async Task<int?> GetCurrentUserIdAsync()

    {

        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;

        if (string.IsNullOrEmpty(email)) return null;

        var username = User.FindFirst(ClaimTypes.Name)?.Value;

        var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);

        return user.Id;

    }

}
