using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for comment CRUD, user search, and entity stack search.</summary>
/// <remarks>
///   Requires <c>projects.read</c> for read operations and <c>projects.write</c> for creating
///   comments. Supports comment creation with automatic user provisioning from JWT claims,
///   project-scoped user search for @-mentions, and hierarchy entity search for linking.
/// </remarks>
/// <remarks>Initializes the controller with required services and repositories.</remarks>
/// <param name="commentService">The comment service.</param>
/// <param name="userRepository">The user repository.</param>
/// <param name="commentRepository">The comment repository.</param>
/// <param name="permissionService">The permission service for project-level authorization.</param>
/// <param name="logger">The logger for audit and error events.</param>
[Route("api/comments")]
[ApiController]
public class CommentsController(ICommentService commentService,
                          IUserRepository userRepository,
                          ICommentRepository commentRepository,
                          IPermissionService permissionService,
                          ILogger<CommentsController> logger) : ControllerBase
{
    private readonly ICommentService _commentService = commentService;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly ICommentRepository _commentRepository = commentRepository;
    private readonly IPermissionService _permissionService = permissionService;
    private readonly ILogger<CommentsController> _logger = logger;

    /// <summary>Retrieve comments for a parent entity.</summary>
    /// <param name="type">Parent entity type (<c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, <c>"moment"</c>).</param>
    /// <param name="parentId">Parent entity ID.</param>
    /// <response code="200">Returns the threaded comments as DTOs.</response>
    /// <response code="400"><paramref name="type"/> is empty or <paramref name="parentId"/> is not positive.</response>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(
        [FromQuery] string? type,
        [FromQuery] int parentId)
    {
        if (string.IsNullOrEmpty(type) || parentId <= 0)
            return BadRequest("Type and parentId are required.");

        var comments = await _commentService.GetCommentsAsync(type, parentId);
        return Ok(comments);
    }

    /// <summary>Create a new comment with auto-provisioning of the author.</summary>
    /// <param name="dto">The comment creation data.</param>
    /// <response code="201">Returns the created comment with a Location header.</response>
    /// <response code="400">Comment text is empty or a business rule fails.</response>
    /// <response code="401">Missing email claim in the JWT token.</response>
    /// <response code="403">User does not have Comment-level permission on the project.</response>
    [Authorize(Policy = "projects.write")]
    [HttpPost]
    public async Task<ActionResult<CommentDto>> CreateComment([FromBody] CreateCommentDto dto)
    {
        if (dto is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Comment text cannot be empty.");

        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value;

        if (string.IsNullOrEmpty(email))
            return Unauthorized("Missing email claim");

        var username = User.FindFirst(ClaimTypes.Name)?.Value;

        try
        {
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);

            int projectId;
            try
            {
                projectId = await _commentRepository.ResolveProjectIdAsync(dto.ParentType, dto.ParentId);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Comment parent entity not found: {Type} {Id}", dto.ParentType, dto.ParentId);
                return NotFound("Parent entity not found.");
            }

            var level = await _permissionService.GetUserPermissionAsync(user.Id, projectId);
            if (level == null || level < PermissionLevel.Comment)
                return Forbid();

            var comment = await _commentService.CreateCommentAsync(dto, user.Id);

            return CreatedAtAction(nameof(GetComments),
                new { type = dto.ParentType, parentId = dto.ParentId }, comment);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to create comment");
            return BadRequest("The comment could not be created.");
        }
    }

    /// <summary>Search for users within a project (for @-mention auto-complete).</summary>
    /// <param name="parentType">The parent entity type to resolve the project.</param>
    /// <param name="parentId">The parent entity ID.</param>
    /// <param name="search">The user name search term.</param>
    /// <response code="200">Returns matching users with ID and name.</response>
    /// <response code="400">Invalid parent type or entity not found.</response>
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
            _logger.LogWarning(ex, "User search failed");
            return BadRequest("Invalid parent type or entity not found.");
        }
    }

    /// <summary>Search the entity hierarchy for linking entities in comments.</summary>
    /// <param name="parentType">The parent entity type to resolve the project.</param>
    /// <param name="parentId">The parent entity ID.</param>
    /// <param name="search">The entity statement search term.</param>
    /// <response code="200">Returns matching stack items with type and sequence info.</response>
    /// <response code="400">Invalid parent type or entity not found.</response>
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
            _logger.LogWarning(ex, "Failed to search entity hierarchy");
            return BadRequest("Invalid parent type or entity not found.");
        }
    }
}
