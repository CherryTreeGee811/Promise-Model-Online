using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using PromiseModelOnline.Api.BusinessLogic.Interfaces;

using PromiseModelOnline.Api.DAL.Interfaces;

using PromiseModelOnline.Api.DTOs;

using System;

using System.Collections.Generic;

using System.Security.Claims;

using System.Threading.Tasks;

using Microsoft.Extensions.Logging;



namespace PromiseModelOnline.Api.Controllers

{

    /// <summary>REST controller for emoji-style reactions on stack items.</summary>

    /// <remarks>

    ///   Provides CRUD for reactions with user ownership validation.

    ///   Requires <c>projects.read</c> for reads and <c>projects.write</c> for mutations.

    /// </remarks>

    [Route("api/reactions")]

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



        /// <summary>Get all reactions for a stack item.</summary>

        [Authorize(Policy = "projects.read")]

        [HttpGet]

        /// <param name="itemId">The item ID.</param>
        /// <param name="type">The entity type discriminator.</param>
        /// <returns>A list of reaction DTOs.</returns>
        public async Task<ActionResult<IEnumerable<ReactionDTO>>> GetReactions(

            [FromQuery] string type, [FromQuery] int itemId)

        {

            var reactions = await _reactionService.GetReactionsAsync(type, itemId);

            return Ok(reactions);

        }



        /// <summary>Add a reaction to a stack item.</summary>

        /// <param name="request">The reaction creation data.</param>
        /// <returns>The created reaction DTO.</returns>
        [Authorize(Policy = "projects.write")]

        [HttpPost]

        public async Task<ActionResult<ReactionDTO>> CreateReaction([FromBody] CreateReactionRequest request)

        {

            var userId = await GetCurrentUserIdAsync();

            if (userId is null) return Unauthorized();



            try

            {

                var result = await _reactionService.CreateReactionAsync(request, userId.Value);

                _logger.LogInformation("User {UserId} created reaction {ReactionId}", userId.Value, result.Id);

                return CreatedAtAction(nameof(GetReactions), new { type = request.StackItemType, itemId = request.StackItemId }, result);

            }

            catch (InvalidOperationException ex) { return BadRequest(ex.Message); }

        }



        /// <summary>Update an existing reaction's emote.</summary>

        /// <param name="id">The reaction ID.</param>
        /// <param name="request">The update request data.</param>
        /// <returns>The updated reaction DTO.</returns>
        [Authorize(Policy = "projects.write")]

        [HttpPatch("{id}")]

        public async Task<ActionResult<ReactionDTO>> UpdateReaction(int id, [FromBody] UpdateReactionRequestDTO request)

        {

            var userId = await GetCurrentUserIdAsync();

            if (userId is null) return Unauthorized();



            if (request is null) return BadRequest("Request body is required.");

            if (!ModelState.IsValid) return ValidationProblem(ModelState);



            try

            {

                var result = await _reactionService.UpdateReactionAsync(id, request, userId.Value);

                _logger.LogInformation("User {UserId} updated reaction {ReactionId}", userId.Value, id);

                return Ok(result);

            }

            catch (InvalidOperationException ex)

            {

                if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))

                    return NotFound(ex.Message);

                return BadRequest(ex.Message);

            }

        }



        /// <summary>Remove a reaction.</summary>

        [Authorize(Policy = "projects.write")]

        [HttpDelete("{id}")]

        /// <param name="id">The entity ID.</param>
        /// <returns>NoContent on success.</returns>
        public async Task<ActionResult> DeleteReaction(int id)

        {

            var userId = await GetCurrentUserIdAsync();

            if (userId == null) return Unauthorized();



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

            var username = User.FindFirst("nameid")?.Value;

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);

            return user.Id;

        }

    }

}
