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
using System.Threading.Tasks;
namespace PromiseModelOnline.Api.Controllers;

/// <summary>CRUD endpoints for flows within a project.</summary>
/// <remarks>Initializes a new instance of the <see cref="ProjectFlowsController"/> class.</remarks>
/// <param name="context">The database context for data access.</param>
/// <param name="mapper">The mapper for converting between entities and DTOs.</param>
/// <param name="projectService">The service for project operations.</param>
/// <param name="service">The service for business logic operations.</param>
[Route("api/projects/{owner}/{project}/flows")]
public class ProjectFlowsController(
    IGenericService<Flow> service,
    IGenericMapper<Flow, FlowDto> mapper,
    IPromiseModelOnlineContext context,
    IProjectService projectService,
    IFlowRepository flowRepo,
    IJourneyRepository journeyRepo) : ProjectScopedControllerBase(projectService)
{
    private readonly IGenericService<Flow> _service = service;
    private readonly IGenericMapper<Flow, FlowDto> _mapper = mapper;
    private readonly IPromiseModelOnlineContext _context = context;
    private readonly IFlowRepository _flowRepo = flowRepo;
    private readonly IJourneyRepository _journeyRepo = journeyRepo;

    /// <summary>Return all flows for a project, optionally filtered by journey.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <param name="journeySeq">Optional journey sequence number to filter by.</param>
    /// <returns>A list of flow DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FlowDto>>> GetAll(string owner, string project, [FromQuery] int? journeySeq = null, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        IEnumerable<Flow> flows;

        if (journeySeq.HasValue)
        {
            var journey = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == journeySeq.Value, cancellationToken);

            if (journey is null)
                return NotFound("Journey not found.");

            flows = await _flowRepo
                .GetFlowsByJourneyAsync(journey.Id, cancellationToken);
        }
        else
        {
            flows = await _context.Flows
                .Where(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id)
                .ToListAsync(cancellationToken);
        }

        var result = new List<FlowDto>();
        foreach (var flow in flows)
            result.Add(_mapper.Map(flow, _service));

        return Ok(result);
    }
    /// <summary>Return a flow by its sequence number within the project.</summary>
    /// <param name="seq">The flow sequence number.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching flow as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("{seq}")]
    public async Task<ActionResult<FlowDto>> GetBySeq(int seq, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var flow = await _context.Flows
            .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq, cancellationToken);

        if (flow is null)
            return NotFound();

        return Ok(_mapper.Map(flow, _service));
    }
    /// <summary>Return a flow by its ID within the project scope.</summary>
    /// <param name="id">The flow's primary key.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching flow as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("by-id/{id}")]
    public async Task<ActionResult<FlowDto>> GetById(int id, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var flow = await _flowRepo.GetByIdAsync(id, cancellationToken);

        if (flow is null)
            return NotFound();

        var journey = await _journeyRepo.GetByIdAsync(flow.JourneyId, cancellationToken);
        if (journey is null)
            return NotFound();

        var epic = await _context.Epics
            .FirstOrDefaultAsync(e => e.Id == journey.EpicId && e.ProductPromise.ProjectId == projectEntity.Id, cancellationToken);
        if (epic is null)
            return NotFound();

        return Ok(_mapper.Map(flow, _service));
    }
    /// <summary>Update a flow within the project scope.</summary>
    /// <param name="seq">The flow sequence number.</param>
    /// <param name="dto">The updated flow data.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPut("{seq}")]
    public async Task<IActionResult> Update(int seq, [FromBody] UpdateFlowRequestDto dto, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (dto is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity, cancellationToken))
            return Forbid();

        var existing = await _context.Flows
            .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq, cancellationToken);

        if (existing is null)
            return NotFound();

        if (existing.Id != dto.Id)
            return BadRequest();

        existing.Statement = dto.Statement;
        existing.Description = dto.Description;
        existing.JourneyId = dto.JourneyId;
        existing.SequenceNumber = dto.SequenceNumber;
        existing.DisplayOrder = dto.DisplayOrder;
        existing.StatusColor = dto.StatusColor;
        existing.OwnerId = dto.OwnerId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _service.UpdateAsync(existing, cancellationToken);
        return NoContent();
    }
    /// <summary>Delete a flow by its sequence number.</summary>
    /// <param name="seq">The flow sequence number.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpDelete("{seq}")]
    public async Task<IActionResult> Delete(int seq, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity, cancellationToken))
            return Forbid();

        var flow = await _context.Flows
            .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq, cancellationToken);

        if (flow is null)
            return NotFound();

        var deleted = await _service.DeleteByIdAsync(flow.Id, cancellationToken);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
    /// <summary>Create a flow from a DTO with auto-generated sequence number.</summary>
    /// <param name="request">The flow creation data.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The created flow as a DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost("create")]
    public async Task<ActionResult<FlowDto>> CreateFromDto([FromBody] CreateFlowRequestDto request, string owner, string project, CancellationToken cancellationToken = default)
    {
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity, cancellationToken))
            return Forbid();

        if (request is null)
            return BadRequest("Request is required.");

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var journey = await _journeyRepo.GetByIdAsync(request.JourneyId, cancellationToken);

        if (journey is null)
            return NotFound("Journey not found.");

        var epic = await _context.Epics
            .FirstOrDefaultAsync(e => e.Id == journey.EpicId && e.ProductPromise.ProjectId == projectEntity.Id, cancellationToken);
        if (epic is null)
            return NotFound("Journey not found.");

        var nextSeq = await _context.GetNextFlowSequenceAsync(journey.Id, cancellationToken);

        var flow = new Flow
        {
            Statement = request.Statement,
            Description = request.Description,
            JourneyId = journey.Id,
            SequenceNumber = nextSeq,
            DisplayOrder = request.DisplayOrder,
            StatusColor = "red"
        };

        await _service.AddAsync(flow, cancellationToken);
        return CreatedAtAction(nameof(GetBySeq), new { owner, project, seq = flow.SequenceNumber }, _mapper.Map(flow, _service));
    }
    /// <summary>Update a flow's description.</summary>
    /// <param name="seq">The flow sequence number.</param>
    /// <param name="request">The description update request.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPatch("{seq}/description")]
    public async Task<ActionResult<FlowDto>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDto request, string owner, string project, CancellationToken cancellationToken = default)
    {
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity, cancellationToken))
            return Forbid();

        if (request is null)
            return BadRequest("Request body is required.");

        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var flow = await _context.Flows
            .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq, cancellationToken);

        if (flow is null)
            return NotFound();

        flow.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        flow.UpdatedAt = DateTime.UtcNow;

        await _service.UpdateAsync(flow, cancellationToken);
        return Ok(_mapper.Map(flow, _service));
    }
}
