using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for retrieving moments assigned to the current user.</summary>
/// <remarks>
///   Resolves the current user from JWT claims and returns their assigned moments with
///   project context (owner slug and project slug) for URL construction.
///   Requires <c>projects.read</c> policy.
/// </remarks>
/// <remarks>Initializes the controller with required services and repositories.</remarks>
/// <param name="momentService">The moment service.</param>
/// <param name="mapper">The mapper.</param>
/// <param name="userRepository">The user repository.</param>
/// <param name="context">The database context.</param>
[ApiController]
[Route("api/moments")]
public class MyMomentsController(
    IMomentService momentService,
    IGenericMapper<Moment, MomentDto> mapper,
    IUserRepository userRepository,
    IPromiseModelOnlineContext context) : ControllerBase
{
    private readonly IMomentService _momentService = momentService;
    private readonly IGenericMapper<Moment, MomentDto> _mapper = mapper;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IPromiseModelOnlineContext _context = context;

    /// <summary>Return moments assigned to the current user, with project slug context.</summary>
    [Authorize(Policy = "projects.read")]
    [HttpGet("assigned-to-me")]
    public async Task<ActionResult<IEnumerable<MomentDto>>> GetMyAssignedMoments()
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();

        var moments = await _momentService.GetMomentsByOwnerIdAsync(user.Id);
        var result = new List<MomentDto>();
        foreach (var m in moments)
        {
            var dto = _mapper.Map(m, _momentService);
            var projectInfo = await ResolveProjectContextAsync(m.FlowId);
            if (projectInfo is not null)
            {
                dto.OwnerSlug = projectInfo.Value.OwnerSlug;
                dto.ProjectSlug = projectInfo.Value.ProjectSlug;
            }
            result.Add(dto);
        }
        return Ok(result);
    }

    /// <summary>Resolve owner and project slugs from a flow ID for URL construction.</summary>
    /// <param name="flowId">The flow ID to resolve.</param>
    /// <returns>A tuple of owner slug and project slug, or <c>null</c> if not found.</returns>
    private async Task<(string OwnerSlug, string ProjectSlug)?> ResolveProjectContextAsync(int flowId)
    {
        var result = await _context.Flows
            .Where(f => f.Id == flowId)
            .Select(f => new
            {
                OwnerSlug = f.Journey.Epic.ProductPromise.Project.Owner.Slug,
                ProjectSlug = f.Journey.Epic.ProductPromise.Project.Slug
            })
            .FirstOrDefaultAsync();

        if (result is null) return null;
        return (result.OwnerSlug, result.ProjectSlug);
    }

    /// <summary>Resolve the current user from JWT claims.</summary>
    private async Task<User?> GetCurrentUserAsync()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value
                 ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrEmpty(email)) return null;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
    }
}
