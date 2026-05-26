using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;

        public CommentsController(
            ICommentService commentService,
            IUserRepository userRepository,
            IPermissionService permissionService)
        {
            _commentService = commentService;
            _userRepository = userRepository;
            _permissionService = permissionService;
        }

        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public async Task<ActionResult> GetComments(string type, int parentId)
        {
            if (string.IsNullOrEmpty(type) || parentId <= 0)
                return BadRequest("Type and parentId are required");

            var userId = await GetCurrentUserIdAsync();
            if (userId == null) return Unauthorized();

            var projectId = await _commentService.GetProjectIdAsync(type, parentId);

            if (!await _permissionService.HasPermissionAsync(
                userId.Value, projectId, PermissionLevel.View))
                return Forbid();

            var result = await _commentService.GetCommentsAsync(type, parentId);
            return Ok(result);
        }

        [Authorize(Policy = "Projects.Write")]
        [HttpPost]
        public async Task<ActionResult> CreateComment(CreateCommentDTO dto)
        {
            var userId = await GetCurrentUserIdAsync();
            if (userId == null) return Unauthorized();

            try
            {
                var comment = await _commentService.CreateCommentAsync(dto, userId.Value);
                return CreatedAtAction(nameof(GetComments),
                    new { type = dto.ParentType, parentId = dto.ParentId },
                    comment);
            }
            catch
            {
                return BadRequest("Invalid operation.");
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