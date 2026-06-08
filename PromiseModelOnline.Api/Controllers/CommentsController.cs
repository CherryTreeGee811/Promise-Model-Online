using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/comments")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IUserRepository _userRepository;
        private readonly ICommentRepository _commentRepository;

        public CommentsController(ICommentService commentService,
                                  IUserRepository userRepository,
                                  ICommentRepository commentRepository)
        {
            _commentService = commentService;
            _userRepository = userRepository;
            _commentRepository = commentRepository;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CommentDTO>>> GetComments(
            [FromQuery] string? type,
            [FromQuery] int parentId)
        {
            if (string.IsNullOrEmpty(type) || parentId <= 0)
                return BadRequest("Type and parentId are required.");

            var comments = await _commentService.GetCommentsAsync(type, parentId);
            return Ok(comments);
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<CommentDTO>> CreateComment([FromBody] CreateCommentDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Text))
                return BadRequest("Comment text cannot be empty.");

            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email))
                return Unauthorized("Missing email claim");

            var username = User.FindFirst("nameid")?.Value;

            try
            {
                var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);
                var comment = await _commentService.CreateCommentAsync(dto, user.Id);

                return CreatedAtAction(nameof(GetComments),
                    new { type = dto.ParentType, parentId = dto.ParentId }, comment);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("search-users")]
        public async Task<ActionResult<IEnumerable<object>>> SearchUsers(
            [FromQuery] string? parentType,
            [FromQuery] int parentId,
            [FromQuery] string? search)
        {
            if (string.IsNullOrEmpty(parentType) || parentId <= 0 || string.IsNullOrWhiteSpace(search))
                return Ok(Array.Empty<object>());

            try
            {
                var projectId = await _commentRepository.ResolveProjectIdAsync(parentType, parentId);
                var users = await _userRepository.SearchUsersByProjectAsync(projectId, search);
                return Ok(users.Select(u => new { u.Id, u.Name }));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("search-promises")]
        public async Task<ActionResult<IEnumerable<StackSearchResult>>> SearchPromises(
            [FromQuery] string? parentType,
            [FromQuery] int parentId,
            [FromQuery] string? search)
        {
            if (string.IsNullOrEmpty(parentType) || parentId <= 0 || string.IsNullOrWhiteSpace(search))
                return Ok(Enumerable.Empty<StackSearchResult>());

            try
            {
                var projectId = await _commentRepository.ResolveProjectIdAsync(parentType, parentId);
                var results = await _commentRepository.SearchStackByStatementAsync(projectId, search);
                return Ok(results);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
