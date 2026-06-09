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

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects/{owner:regex(^[[a-zA-Z0-9_-]]+$)}/{project:regex(^[[a-zA-Z0-9_-]]+$)}")]
    public class ProjectDetailController : ProjectScopedControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly IGenericService<Promise> _promiseService;
        private readonly IGenericMapper<Project, ProjectDTO> _mapper;
        private readonly IGenericMapper<Promise, PromiseDTO> _promiseMapper;
        private readonly IGenericService<Project> _service;
        private readonly IProjectExportService _projectExportService;
        private readonly IPromiseModelOnlineContext _context;

        public ProjectDetailController(
            IProjectService projectService,
            IUserRepository userRepository,
            IPermissionService permissionService,
            IGenericService<Promise> promiseService,
            IGenericMapper<Project, ProjectDTO> mapper,
            IGenericMapper<Promise, PromiseDTO> promiseMapper,
            IGenericService<Project> service,
            IProjectExportService projectExportService,
            IPromiseModelOnlineContext context)
            : base(projectService)
        {
            _userRepository = userRepository;
            _permissionService = permissionService;
            _promiseService = promiseService;
            _mapper = mapper;
            _promiseMapper = promiseMapper;
            _service = service;
            _projectExportService = projectExportService;
            _context = context;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<ProjectDTO>> GetBySlug(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var accessibleProjects = await _projectService.GetAccessibleProjectsAsync(user.Id);
            if (!accessibleProjects.Any(p => p.Id == projectEntity.Id))
                return Forbid();

            return Ok(_mapper.Map(projectEntity, _service));
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("members")]
        public async Task<ActionResult<IEnumerable<ProjectMemberDTO>>> GetMembers(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null) return NotFound();

            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var members = await _projectService.GetProjectMembersAsync(projectEntity.Id);
            return Ok(members);
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("promises")]
        public async Task<ActionResult<IEnumerable<PromiseDTO>>> GetProjectPromises(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null) return NotFound();

            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var promises = await _projectService.GetProductPromisesAsync(projectEntity.Id);
            var result = promises
                .OrderBy(promise => promise.DisplayOrder)
                .Select(promise => _promiseMapper.Map(promise, _promiseService))
                .ToList();

            return Ok(result);
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("entity-map")]
        public async Task<ActionResult<IEnumerable<object>>> GetEntityMap(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null) return NotFound();

            var entityMap = new List<object>();

            var promises = await _context.Promises
                .Where(p => p.ProjectId == projectEntity.Id)
                .Select(p => new { EntityType = "promise", p.Id, p.SequenceNumber })
                .ToListAsync();
            entityMap.AddRange(promises);

            var promiseIds = promises.Select(p => p.Id).ToList();

            var epics = await _context.Epics
                .Where(e => promiseIds.Contains(e.ProductPromiseId))
                .Select(e => new { EntityType = "epic", e.Id, e.SequenceNumber })
                .ToListAsync();
            entityMap.AddRange(epics);

            var epicIds = epics.Select(e => e.Id).ToList();

            var journeys = await _context.Journeys
                .Where(j => epicIds.Contains(j.EpicId))
                .Select(j => new { EntityType = "journey", j.Id, j.SequenceNumber })
                .ToListAsync();
            entityMap.AddRange(journeys);

            var journeyIds = journeys.Select(j => j.Id).ToList();

            var flows = await _context.Flows
                .Where(f => journeyIds.Contains(f.JourneyId))
                .Select(f => new { EntityType = "flow", f.Id, f.SequenceNumber })
                .ToListAsync();
            entityMap.AddRange(flows);

            var flowIds = flows.Select(f => f.Id).ToList();

            var moments = await _context.Moments
                .Where(m => flowIds.Contains(m.FlowId))
                .Select(m => new { EntityType = "moment", m.Id, m.SequenceNumber })
                .ToListAsync();
            entityMap.AddRange(moments);

            return Ok(entityMap);
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null) return NotFound();

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email);
            var permission = await _permissionService.GetUserPermissionAsync(user.Id, projectEntity.Id);

            if (permission == null)
                return NoContent();

            return Ok(permission.ToString());
        }

        [Authorize(Policy = "projects.write")]
        [HttpPatch("details")]
        public async Task<ActionResult<ProjectDTO>> UpdateDetails(string owner, string project, [FromBody] UpdateProjectDetailsRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Project title is required.");

            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            projectEntity.Name = request.Name.Trim();
            projectEntity.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();

            await _service.UpdateAsync(projectEntity);
            return Ok(_mapper.Map(projectEntity, _service));
        }

        [Authorize(Policy = "projects.write")]
        [HttpDelete]
        public async Task<IActionResult> Delete(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var deleted = await _service.DeleteByIdAsync(projectEntity.Id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("export")]
        public async Task<IActionResult> Export(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var accessibleProjects = await _projectService.GetAccessibleProjectsAsync(user.Id);
            if (!accessibleProjects.Any(p => p.Id == projectEntity.Id))
                return Forbid();

            try
            {
                var exportDocument = await _projectExportService.BuildExportAsync(projectEntity.Id);
                var json = JsonSerializer.Serialize(exportDocument, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                return File(Encoding.UTF8.GetBytes(json), "application/json", $"{projectEntity.Slug}-export.json");
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("audit-events")]
        public async Task<ActionResult<IEnumerable<AuditTimelineItemDTO>>> GetAuditEvents(
            string owner, string project,
            [FromQuery] int take = 100,
            [FromQuery] int skip = 0)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            take = take <= 0 ? 100 : take > 500 ? 500 : take;

            var query = _context.AuditEvents
                .Where(entry => entry.ProjectId == projectEntity.Id)
                .OrderByDescending(entry => entry.OccurredAtUtc)
                .ThenByDescending(entry => entry.Id);

            Response.Headers["X-Total-Count"] = query.Count().ToString();

            var events = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return Ok(events.Select(MapToAuditDto));
        }

        private static AuditTimelineItemDTO MapToAuditDto(AuditEvent auditEvent)
        {
            var changes = DeserializeAuditChanges(auditEvent.ChangesJson);
            return new AuditTimelineItemDTO
            {
                Id = auditEvent.Id,
                OccurredAtUtc = auditEvent.OccurredAtUtc,
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

        private static IReadOnlyList<AuditFieldChangeDTO> DeserializeAuditChanges(string? changesJson)
        {
            if (string.IsNullOrWhiteSpace(changesJson))
                return [];

            var changes = JsonSerializer.Deserialize<Dictionary<string, AuditChangeDTO>>(changesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (changes is null || changes.Count == 0)
                return [];

            return changes
                .Select(entry => new AuditFieldChangeDTO
                {
                    FieldName = entry.Key,
                    Before = entry.Value.Before,
                    After = entry.Value.After
                })
                .ToList();
        }

        private static string BuildAuditSummary(AuditEvent auditEvent, IReadOnlyList<AuditFieldChangeDTO> changes)
        {
            if (string.Equals(auditEvent.ActionType, "Created", System.StringComparison.OrdinalIgnoreCase))
                return $"Created {auditEvent.EntityType}";
            if (string.Equals(auditEvent.ActionType, "Deleted", System.StringComparison.OrdinalIgnoreCase))
                return $"Deleted {auditEvent.EntityType}";
            if (string.Equals(auditEvent.ActionType, "StatusChanged", System.StringComparison.OrdinalIgnoreCase))
            {
                var statusChange = changes.FirstOrDefault(c => string.Equals(c.FieldName, "Status", System.StringComparison.OrdinalIgnoreCase));
                if (statusChange is not null)
                    return $"Changed status from {statusChange.Before} to {statusChange.After}";
            }
            if (changes.Count == 0)
                return $"Updated {auditEvent.EntityType}";
            var fields = string.Join(", ", changes.Select(c => c.FieldName));
            return $"Updated {auditEvent.EntityType}: {fields}";
        }

        private sealed class AuditChangeDTO
        {
            public object? Before { get; set; }
            public object? After { get; set; }
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }
    }
}
