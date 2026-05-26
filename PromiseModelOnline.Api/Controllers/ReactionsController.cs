using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class ReactionsController : ControllerBase
    {
        private readonly IReactionService _reactionService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ReactionsController> _logger;

        public ReactionsController(IReactionService reactionService,
                                   IUserRepository userRepository,
                                   ILogger<ReactionsController> logger)
        {
            _reactionService = reactionService;
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReactionDTO>>> GetReactions(
            [FromQuery] string type,
            [FromQuery] int itemId)
        {
            var reactions = await _reactionService.GetReactionsAsync(type, itemId);
            return Ok(reactions);
        }

        /// <summary>
        /// Creates a new reaction resource for the current user.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ReactionDTO>> CreateReaction([FromBody] CreateReactionRequest request)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            try
            {
                var result = await _reactionService.CreateReactionAsync(request, userId.Value);

                _logger.LogInformation(
                    "User {UserId} created Reaction {ReactionId} at {UtcTimestamp}: {Details}",
                    userId.Value,
                    result.Id,
                    DateTime.UtcNow,
                    new { result.StackItemType, result.StackItemId, result.Emote });

                return CreatedAtAction(nameof(GetReactions), new { type = request.StackItemType, itemId = request.StackItemId }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Partially updates an existing reaction resource (emote only).
        /// </summary>
        [HttpPatch("{id}")]
        public async Task<ActionResult<ReactionDTO>> UpdateReaction(int id, [FromBody] UpdateReactionRequestDTO request)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var result = await _reactionService.UpdateReactionAsync(id, request, userId.Value);

                _logger.LogInformation(
                    "User {UserId} updated Reaction {ReactionId} at {UtcTimestamp}: {Changes}",
                    userId.Value,
                    id,
                    DateTime.UtcNow,
                    new { request.Emote });

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                    return NotFound(ex.Message);

                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteReaction(int id)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId == null) return Unauthorized();

            try
            {
                await _reactionService.RemoveReactionAsync(id, userId.Value);

                _logger.LogInformation(
                    "User {UserId} deleted reaction {ReactionId}",
                    userId.Value,
                    id
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                
                _logger.LogWarning(
                        ex,
                        "Failed to delete reaction {ReactionId} by user {UserId}",
                        id,
                        userId.Value
                );

                return BadRequest("Cannot remove reaction.");
            }
        }

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