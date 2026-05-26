using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Hubs;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ReactionsController : ControllerBase
    {
        private readonly IReactionService _reactionService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ReactionsController> _logger;
        private readonly IPermissionService _permissionService;
        private readonly IHubContext<NotificationHub> _hub;

        public ReactionsController(
            IReactionService reactionService,
            IUserRepository userRepository,
            ILogger<ReactionsController> logger,
            IPermissionService permissionService,
            IHubContext<NotificationHub> hub)
        {
            _reactionService = reactionService;
            _userRepository = userRepository;
            _logger = logger;
            _permissionService = permissionService;
            _hub = hub;
        }

        // =========================================
        // ✅ READ
        // =========================================

        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReactionDTO>>> GetReactions(
            [FromQuery] string type,
            [FromQuery] int itemId)
        {
            if (string.IsNullOrEmpty(type) || itemId <= 0)
                return BadRequest("type and valid itemId are required.");

            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            var projectId = await _reactionService.GetProjectIdAsync(type, itemId);

            if (!await _permissionService.HasPermissionAsync(userId.Value, projectId, PermissionLevel.View))
                return Forbid();

            var reactions = await _reactionService.GetReactionsAsync(type, itemId);

            return Ok(reactions);
        }

        // =========================================
        // ✅ CREATE
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpPost]
        public async Task<ActionResult<ReactionDTO>> CreateReaction([FromBody] CreateReactionRequest request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            var projectId = await _reactionService.GetProjectIdAsync(
                request.StackItemType,
                request.StackItemId);

            if (!await _permissionService.HasPermissionAsync(userId.Value, projectId, PermissionLevel.Comment))
                return Forbid();

            try
            {
                var result = await _reactionService.CreateReactionAsync(request, userId.Value);

                _logger.LogInformation("User {UserId} created Reaction {ReactionId}",
                    userId.Value, result.Id);

                await BroadcastReactionCreatedSafe(
                    request.StackItemType,
                    request.StackItemId,
                    result);

                return CreatedAtAction(nameof(GetReactions),
                    new { type = request.StackItemType, itemId = request.StackItemId },
                    result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid reaction creation attempt");
                return BadRequest("Invalid operation.");
            }
        }

        // =========================================
        // ✅ UPDATE
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpPatch("{id}")]
        public async Task<ActionResult<ReactionDTO>> UpdateReaction(int id, [FromBody] UpdateReactionRequestDTO request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            var projectId = await _reactionService.GetProjectIdByReactionIdAsync(id);

            if (!await _permissionService.HasPermissionAsync(userId.Value, projectId, PermissionLevel.Comment))
                return Forbid();

            try
            {
                var result = await _reactionService.UpdateReactionAsync(id, request, userId.Value);

                _logger.LogInformation("User {UserId} updated Reaction {ReactionId}",
                    userId.Value, id);

                await BroadcastReactionUpdatedSafe(id, result, projectId);

                return Ok(result);
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        // =========================================
        // ✅ DELETE
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReaction(int id)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId == null) return Unauthorized();

            var projectId = await _reactionService.GetProjectIdByReactionIdAsync(id);

            if (!await _permissionService.HasPermissionAsync(userId.Value, projectId, PermissionLevel.Comment))
                return Forbid();

            try
            {
                await _reactionService.RemoveReactionAsync(id, userId.Value);

                _logger.LogInformation("User {UserId} deleted Reaction {ReactionId}",
                    userId.Value, id);

                await BroadcastReactionDeletedSafe(id, projectId);

                return NoContent();
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }
        }

        // =========================================
        // ✅ SIGNALR BROADCASTS
        // =========================================

        private async Task BroadcastReactionCreatedSafe(string type, int itemId, ReactionDTO reaction)
        {
            try
            {
                var projectId = await _reactionService.GetProjectIdAsync(type, itemId);

                await _hub.Clients
                    .Group($"project-{projectId}")
                    .SendAsync("ReactionAdded", reaction);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to broadcast ReactionAdded");
            }
        }

        private async Task BroadcastReactionUpdatedSafe(int reactionId, ReactionDTO reaction, int projectId)
        {
            try
            {
                await _hub.Clients
                    .Group($"project-{projectId}")
                    .SendAsync("ReactionUpdated", reaction);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to broadcast ReactionUpdated");
            }
        }

        private async Task BroadcastReactionDeletedSafe(int reactionId, int projectId)
        {
            try
            {
                await _hub.Clients
                    .Group($"project-{projectId}")
                    .SendAsync("ReactionDeleted", new { Id = reactionId });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to broadcast ReactionDeleted");
            }
        }

        // =========================================
        // ✅ AUTH HELPER (OAUTH SAFE)
        // =========================================

        private async Task<int?> GetCurrentUserIdAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);

            return user.Id;
        }
    }
}