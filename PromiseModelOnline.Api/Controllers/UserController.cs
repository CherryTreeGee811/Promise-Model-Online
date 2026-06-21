using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for user profile, search, data export, and account deletion.</summary>
/// <remarks>
///   All endpoints require <c>projects.read</c> authorization. Provides the current user's
///   profile info, global user search, personal data export, and account deletion.
/// </remarks>
/// <remarks>Initializes the controller with required services and repositories.</remarks>
/// <param name="userRepository">The user repository.</param>
/// <param name="projectRepository">The project repository.</param>
/// <param name="context">The database context.</param>
[ApiController]
[Route("api/users")]
public class UsersController(
    IUserRepository userRepository,
    IProjectRepository projectRepository,
    PromiseModelOnlineContext context) : ControllerBase
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IProjectRepository _projectRepository = projectRepository;
    private readonly PromiseModelOnlineContext _context = context;

    /// <summary>Return the current user's profile information.</summary>
    [Authorize(Policy = "projects.read")]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        var id = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var name = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name);

        int? userId = null;
        if (!string.IsNullOrEmpty(email))
        {
            var users = await _userRepository.FindByEmailAsync(email);
            var user = users.FirstOrDefault();
            if (user is not null) userId = user.Id;
        }

        return Ok(new { id, name, email, userId });
    }

    /// <summary>Search for users globally by name or email.</summary>
    /// <param name="q">The search term.</param>
    /// <param name="max">Maximum results (default 10).</param>
    /// <returns>An IActionResult containing the exported JSON data.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<object>>> SearchUsers([FromQuery] string q, [FromQuery] int max = 10)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<object>());
        var users = await _userRepository.SearchUsersAsync(q, max);
        return Ok(users.Select(u => new { u.Id, u.Name, u.Email }));
    }

    /// <summary>Export all of the current user's personal data.</summary>
    [Authorize(Policy = "projects.read")]
    [HttpGet("me/export")]
    public async Task<IActionResult> ExportMyData()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var users = await _userRepository.FindByEmailAsync(email);
        var user = users.FirstOrDefault();
        if (user is null) return NotFound();

        var userId = user.Id;
        var exportedAt = DateTime.UtcNow;

        var projects = await _projectRepository.GetProjectsOwnedByUserAsync(userId);
        var reactions = await _context.Reactions.Where(r => r.UserId == userId).ToListAsync();
        var comments = await _context.Set<Comment>().Where(c => c.UserId == userId).ToListAsync();
        var notifications = await _context.Set<Notification>().Where(n => n.UserId == userId).ToListAsync();
        var permissions = await _context.Set<Permission>().Where(p => p.UserId == userId).ToListAsync();
        var assignments = await _context.Set<MomentAssignment>().Where(ma => ma.UserId == userId).ToListAsync();

        return Ok(new
        {
            exportedAt,
            schemaVersion = "1.0",
            account = new { user.Id, user.Name, user.Email, user.Slug, user.CreatedAt },
            projects = projects.Select(p => new { p.Id, p.Name, p.Slug, p.Description, p.CreatedAt }),
            comments = comments.Select(c => new { c.Id, c.Text, c.CreatedAt }),
            reactions = reactions.Select(r => new { r.Id, r.Emote, r.StackItemType, r.StackItemId, r.CreatedAt }),
            notifications = notifications.Select(n => new { n.Id, n.Type, n.Message, n.IsRead, n.CreatedAt }),
            permissions = permissions.Select(p => new { p.Id, p.Level, p.Status, p.ProjectId }),
            momentAssignments = assignments.Select(ma => new { ma.Id, ma.MomentId, ma.Role }),
        });
    }

    /// <summary>Delete the current user's account and associated data.</summary>
    [Authorize(Policy = "projects.read")]
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMyData()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var users = await _userRepository.FindByEmailAsync(email);
        var user = users.FirstOrDefault();
        if (user is null) return NotFound();

        var userId = user.Id;

        var notifications = await _context.Set<Notification>().Where(n => n.UserId == userId).ToListAsync();
        var reactions = await _context.Reactions.Where(r => r.UserId == userId).ToListAsync();
        var permissions = await _context.Set<Permission>().Where(p => p.UserId == userId).ToListAsync();
        var assignments = await _context.Set<MomentAssignment>().Where(ma => ma.UserId == userId).ToListAsync();

        _context.Set<Notification>().RemoveRange(notifications);
        _context.Reactions.RemoveRange(reactions);
        _context.Set<Permission>().RemoveRange(permissions);
        _context.Set<MomentAssignment>().RemoveRange(assignments);

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
