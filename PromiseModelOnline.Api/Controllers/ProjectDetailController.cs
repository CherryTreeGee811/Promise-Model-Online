using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for project detail operations via owner/project slug routing.</summary>
/// <remarks>
///   Routes use regex-validated slug parameters (<c>{owner}</c>, <c>{project}</c>).
///   Requires <c>projects.read</c> for reads and <c>projects.write</c> for mutations.
///   Provides project details, members, promises, entity map, permissions, export, and audit events.
/// </remarks>
/// <remarks>Initializes a new instance of the <see cref="ProjectDetailController"/> class.</remarks>
/// <param name="context">The database context for data access.</param>
/// <param name="logger">The logger for audit and error events.</param>
/// <param name="mapper">The mapper for converting between Project entities and DTOs.</param>
/// <param name="permissionService">The service for permission validation.</param>
/// <param name="projectExportService">The service for project export operations.</param>
/// <param name="projectService">The service for project operations.</param>
/// <param name="promiseMapper">The mapper for converting between Promise entities and DTOs.</param>
/// <param name="promiseService">The service for promise business logic.</param>
/// <param name="service">The service for generic project operations.</param>
/// <param name="userRepository">The repository for user data access.</param>
[Route("api/projects/{owner:regex(^[[a-zA-Z0-9_-]]+$)}/{project:regex(^[[a-zA-Z0-9_-]]+$)}")]
public class ProjectDetailController(
    IProjectService projectService,
    IUserRepository userRepository,
    IPermissionService permissionService,
    IGenericService<Promise> promiseService,
    IGenericMapper<Project, ProjectDto> mapper,
    IGenericMapper<Promise, PromiseDto> promiseMapper,
    IGenericService<Project> service,
    IProjectExportService projectExportService,
    IPromiseModelOnlineContext context,
    ILogger<ProjectDetailController> logger) : ProjectScopedControllerBase(projectService)
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IPermissionService _permissionService = permissionService;
    private readonly IGenericService<Promise> _promiseService = promiseService;
    private readonly IGenericMapper<Project, ProjectDto> _mapper = mapper;
    private readonly IGenericMapper<Promise, PromiseDto> _promiseMapper = promiseMapper;
    private readonly IGenericService<Project> _service = service;
    private readonly IProjectExportService _projectExportService = projectExportService;
    private readonly IPromiseModelOnlineContext _context = context;
    private readonly ILogger<ProjectDetailController> _logger = logger;

    /// <summary>Return project details by owner and project slug.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns the project as a DTO.</response>
    /// <response code="401">User is not authenticated.</response>
    /// <response code="403">User does not have access to the project.</response>
    /// <response code="404">Project not found.</response>
    /// <returns>The project as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<ProjectDto>> GetBySlug(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();
        if (!await UserCanReadProjectAsync(projectEntity)) return Forbid();

        return Ok(_mapper.Map(projectEntity, _service));
    }

    /// <summary>Check the current user has read access to the project (is owner or has a permission record).</summary>
    private async Task<bool> UserCanReadProjectAsync(Project projectEntity)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return false;
        var accessible = await _projectService.GetAccessibleProjectsAsync(user.Id);
        return accessible.Any(p => p.Id == projectEntity.Id);
    }

    /// <summary>Return members of a project.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns the project members.</response>
    /// <returns>A list of project member DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("members")]
    public async Task<ActionResult<IEnumerable<ProjectMemberDto>>> GetMembers(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();
        if (!await UserCanReadProjectAsync(projectEntity)) return Forbid();

        var members = await _projectService.GetProjectMembersAsync(projectEntity.Id);
        return Ok(members);
    }

    /// <summary>Return top-level promises for a project.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns the promises ordered by display order.</response>
    /// <returns>A list of promise DTOs ordered by display order.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("promises")]
    public async Task<ActionResult<IEnumerable<PromiseDto>>> GetProjectPromises(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();
        if (!await UserCanReadProjectAsync(projectEntity)) return Forbid();

        var promises = await _projectService.GetProductPromisesAsync(projectEntity.Id);
        var result = promises.OrderBy(p => p.DisplayOrder)
            .Select(p => _promiseMapper.Map(p, _promiseService)).ToList();
        return Ok(result);
    }

    /// <summary>Return the full entity map for a project (all entities with type and sequence).</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns a flat list of all entities.</response>
    /// <returns>A flat list of all entities in the project.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("entity-map")]
    public async Task<ActionResult<IEnumerable<object>>> GetEntityMap(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();
        if (!await UserCanReadProjectAsync(projectEntity)) return Forbid();

        var entityMap = new List<object>();
        var promises = await _context.Promises
            .Where(p => p.ProjectId == projectEntity.Id)
            .Select(p => new { EntityType = "promise", p.Id, p.SequenceNumber }).ToListAsync();
        entityMap.AddRange(promises);

        var promiseIds = promises.Select(p => p.Id).ToList();
        var epics = await _context.Epics
            .Where(e => promiseIds.Contains(e.ProductPromiseId))
            .Select(e => new { EntityType = "epic", e.Id, e.SequenceNumber }).ToListAsync();
        entityMap.AddRange(epics);

        var epicIds = epics.Select(e => e.Id).ToList();
        var journeys = await _context.Journeys
            .Where(j => epicIds.Contains(j.EpicId))
            .Select(j => new { EntityType = "journey", j.Id, j.SequenceNumber }).ToListAsync();
        entityMap.AddRange(journeys);

        var journeyIds = journeys.Select(j => j.Id).ToList();
        var flows = await _context.Flows
            .Where(f => journeyIds.Contains(f.JourneyId))
            .Select(f => new { EntityType = "flow", f.Id, f.SequenceNumber }).ToListAsync();
        entityMap.AddRange(flows);

        var flowIds = flows.Select(f => f.Id).ToList();
        var moments = await _context.Moments
            .Where(m => flowIds.Contains(m.FlowId))
            .Select(m => new { EntityType = "moment", m.Id, m.SequenceNumber }).ToListAsync();
        entityMap.AddRange(moments);

        return Ok(entityMap);
    }

    /// <summary>Return the current user's permission level for the project.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns the permission level and ownership status.</response>
    /// <response code="204">User has no permission for this project.</response>
    /// <response code="404">Project not found.</response>
    /// <returns>An object containing the permission level and ownership status.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("my-permission")]
    public async Task<ActionResult<object>> GetMyPermission(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();

        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var user = await _userRepository.GetOrCreateUserByEmailAsync(email);
        var permission = await _permissionService.GetUserPermissionAsync(user.Id, projectEntity.Id);

        if (permission == null) return NoContent();
        return Ok(new { permission = permission.ToString(), isOwner = projectEntity.OwnerId == user.Id });
    }

    /// <summary>Update project name and description.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <param name="request">The updated project details.</param>
    /// <response code="200">Returns the updated project.</response>
    /// <response code="400">Invalid request data.</response>
    /// <response code="404">Project not found.</response>
    /// <returns>The updated project DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPatch("details")]
    public async Task<ActionResult<ProjectDto>> UpdateDetails(string owner, string project, [FromBody] UpdateProjectDetailsRequestDto request)
    {
        if (request is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Project title is required.");

        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity))
            return Forbid();

        projectEntity.Name = request.Name.Trim();
        projectEntity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        await _service.UpdateAsync(projectEntity);
        return Ok(_mapper.Map(projectEntity, _service));
    }

    /// <summary>Delete a project by slug.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="204">Project deleted successfully.</response>
    /// <response code="404">Project not found.</response>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpDelete]
    public async Task<IActionResult> Delete(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity))
            return Forbid();

        var deleted = await _service.DeleteByIdAsync(projectEntity.Id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    /// <summary>Export the project as a JSON document for backup or transfer.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns the JSON export file.</response>
    /// <response code="401">User is not authenticated.</response>
    /// <response code="403">User does not have access.</response>
    /// <response code="404">Project not found.</response>
    /// <returns>A JSON file download.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("export")]
    public async Task<IActionResult> Export(string owner, string project)
    {
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();
        if (!await UserCanReadProjectAsync(projectEntity)) return Forbid();

        try
        {
            var exportDocument = await _projectExportService.BuildExportAsync(projectEntity.Id);
            var json = JsonSerializer.Serialize(exportDocument, new JsonSerializerOptions { WriteIndented = true });
            return File(Encoding.UTF8.GetBytes(json), "application/json", $"{projectEntity.Slug}-export.json");
        }
        catch (KeyNotFoundException ex) { _logger.LogWarning(ex, "Export failed: project not found"); return NotFound(); }
    }

    /// <summary>Return paginated audit events for a project.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <param name="take">Maximum results to return (default 100, max 500).</param>
    /// <param name="skip">Number of results to skip for pagination.</param>
    /// <response code="200">Returns paginated audit timeline items with <c>X-Total-Count</c> header.</response>
    /// <response code="404">Project not found.</response>
    /// <returns>A paginated list of audit timeline DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("audit-events")]
    public async Task<ActionResult<IEnumerable<AuditTimelineItemDto>>> GetAuditEvents(
        string owner, string project,
        [FromQuery] int take = 100, [FromQuery] int skip = 0)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null) return NotFound();
        if (!await UserCanReadProjectAsync(projectEntity)) return Forbid();

        if (take <= 0) take = 100;
        else if (take > 500) take = 500;

        var query = _context.AuditEvents
            .Where(entry => entry.ProjectId == projectEntity.Id)
            .OrderByDescending(entry => entry.OccurredAtUtc)
            .ThenByDescending(entry => entry.Id);

        Response.Headers["X-Total-Count"] = (await query.CountAsync()).ToString();

        var events = await query.Skip(skip).Take(take).ToListAsync();
        return Ok(events.Select(MapToAuditDto));
    }

    /// <summary>Map an AuditEvent to its timeline DTO.</summary>
    /// <param name="auditEvent">The audit event to map.</param>
    /// <returns>The mapped timeline DTO.</returns>
    private static AuditTimelineItemDto MapToAuditDto(AuditEvent auditEvent)
    {
        var changes = DeserializeAuditChanges(auditEvent.ChangesJson);
        return new AuditTimelineItemDto
        {
            Id = auditEvent.Id,
            OccurredAtUtc = DateTime.SpecifyKind(auditEvent.OccurredAtUtc, DateTimeKind.Utc),
            ActorUserId = auditEvent.ActorUserId,
            ActorEmail = auditEvent.ActorEmail,
            ActorSubject = auditEvent.ActorSubject,
            EntityType = auditEvent.EntityType,
            EntityId = auditEvent.EntityId,
            ProjectId = auditEvent.ProjectId,
            ActionType = auditEvent.ActionType,
            Summary = BuildAuditSummary(auditEvent, changes),
            Changes = changes
        };
    }

    /// <summary>Deserialize the JSON changes dictionary to audit field change DTOs.</summary>
    /// <param name="changesJson">The JSON string containing the changes dictionary.</param>
    /// <returns>A read-only list of field change DTOs, or empty if none.</returns>
    private static IReadOnlyList<AuditFieldChangeDto> DeserializeAuditChanges(string? changesJson)
    {
        if (string.IsNullOrWhiteSpace(changesJson)) return [];
        var changes = JsonSerializer.Deserialize<Dictionary<string, AuditChangeDto>>(changesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (changes is null || changes.Count == 0) return [];
        return changes.Select(entry => new AuditFieldChangeDto { FieldName = entry.Key, Before = entry.Value.Before, After = entry.Value.After }).ToList();
    }

    /// <summary>Build a human-readable summary from an audit event and its field changes.</summary>
    /// <param name="auditEvent">The audit event.</param>
    /// <param name="changes">The list of field changes.</param>
    /// <returns>A human-readable summary string.</returns>
    private static string BuildAuditSummary(AuditEvent auditEvent, IReadOnlyList<AuditFieldChangeDto> changes)
    {
        if (string.Equals(auditEvent.ActionType, "Created", StringComparison.OrdinalIgnoreCase)) return $"Created {auditEvent.EntityType}";
        if (string.Equals(auditEvent.ActionType, "Deleted", StringComparison.OrdinalIgnoreCase)) return $"Deleted {auditEvent.EntityType}";
        if (string.Equals(auditEvent.ActionType, "StatusChanged", StringComparison.OrdinalIgnoreCase))
        {
            var statusChange = changes.FirstOrDefault(c => string.Equals(c.FieldName, "Status", StringComparison.OrdinalIgnoreCase));
            if (statusChange is not null) return $"Changed status from {statusChange.Before} to {statusChange.After}";
        }
        if (changes.Count == 0) return $"Updated {auditEvent.EntityType}";
        return $"Updated {auditEvent.EntityType}: {string.Join(", ", changes.Select(c => c.FieldName))}";
    }

#pragma warning disable S1144 // setters used by System.Text.Json deserialization
    private sealed class AuditChangeDto { public object? Before { get; set; } = default!; public object? After { get; set; } = default!; }
#pragma warning restore S1144

    /// <summary>Resolve the current user from JWT claims, auto-provisioning if needed.</summary>
    /// <returns>The current user, or <c>null</c> if the email claim is missing.</returns>
    private async Task<User?> GetCurrentUserAsync()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrEmpty(email)) return null;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
    }
}
