using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IUserRepository _userRepository;

        public CommentsController(ICommentService commentService,
                                  IUserRepository userRepository)
        {
            _commentService = commentService;
            _userRepository = userRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CommentDTO>>> GetComments(
            [FromQuery] string type,
            [FromQuery] int parentId)
        {
            if (string.IsNullOrEmpty(type) || parentId <= 0)
                return BadRequest("Type and parentId are required.");

            var comments = await _commentService.GetCommentsAsync(type, parentId);
            return Ok(comments);
        }

        [HttpPost]
        public async Task<ActionResult<CommentDTO>> CreateComment([FromBody] CreateCommentDTO dto)
        {
            // Try the standard claim type first, then fall back to the raw string
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email))
                return Unauthorized("Missing email claim");

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email);

            try
            {
                var comment = await _commentService.CreateCommentAsync(dto, user.Id);
                return CreatedAtAction(nameof(GetComments),
                    new { type = dto.ParentType, parentId = dto.ParentId }, comment);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}