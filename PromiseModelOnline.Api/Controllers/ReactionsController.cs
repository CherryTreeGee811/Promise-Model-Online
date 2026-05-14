using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class ReactionsController : ControllerBase
    {
        private readonly IReactionService _reactionService;
        private readonly IUserRepository _userRepository;

        public ReactionsController(IReactionService reactionService,
                                   IUserRepository userRepository)
        {
            _reactionService = reactionService;
            _userRepository = userRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReactionDTO>>> GetReactions(
            [FromQuery] string type,
            [FromQuery] int itemId)
        {
            var reactions = await _reactionService.GetReactionsAsync(type, itemId);
            return Ok(reactions);
        }

        [HttpPost]
        public async Task<ActionResult<ReactionDTO>> UpsertReaction([FromBody] CreateReactionRequest request)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            var result = await _reactionService.UpsertReactionAsync(request, userId.Value);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReaction(int id)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId is null) return Unauthorized();

            try
            {
                await _reactionService.RemoveReactionAsync(id, userId.Value);
                return NoContent();
            }
            catch (System.Exception)
            {
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