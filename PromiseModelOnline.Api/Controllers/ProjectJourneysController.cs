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

/// <summary>CRUD endpoints for journeys within a project.</summary>
/// <remarks>Initializes a new instance of the <see cref="ProjectJourneysController"/> class.</remarks>
/// <param name="context">The database context for data access.</param>
/// <param name="mapper">The mapper for converting between entities and DTOs.</param>
/// <param name="projectService">The service for project operations.</param>
/// <param name="service">The service for business logic operations.</param>
[Route("api/projects/{owner}/{project}/journeys")]
public class ProjectJourneysController(
    IGenericService<Journey> service,
    IGenericMapper<Journey, JourneyDto> mapper,
    IPromiseModelOnlineContext context,
    IProjectService projectService,
    IJourneyRepository journeyRepo,
    IEpicRepository epicRepo) : ProjectScopedControllerBase(projectService)
{
    private readonly IGenericService<Journey> _service = service;
    private readonly IGenericMapper<Journey, JourneyDto> _mapper = mapper;
    private readonly IPromiseModelOnlineContext _context = context;
    private readonly IJourneyRepository _journeyRepo = journeyRepo;
    private readonly IEpicRepository _epicRepo = epicRepo;

    /// <summary>Return all journeys for a project, optionally filtered by epic.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <param name="epicSeq">Optional epic sequence number to filter by.</param>
    /// <returns>A list of journey DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<JourneyDto>>> GetAll(string owner, string project, [FromQuery] int? epicSeq = null, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        IEnumerable<Journey> journeys;

        if (epicSeq.HasValue)
        {
            var epic = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == epicSeq.Value, cancellationToken);

            if (epic is null)
                return NotFound("Epic not found.");

            journeys = await _journeyRepo
                .GetJourneysByEpicAsync(epic.Id, cancellationToken);
        }
        else
        {
            journeys = await _context.Journeys
                .Where(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id)
                .ToListAsync(cancellationToken);
        }

        var result = new List<JourneyDto>();
        foreach (var j in journeys)
            result.Add(_mapper.Map(j, _service));

        return Ok(result);
    }
    /// <summary>Return a journey by its sequence number within the project.</summary>
    /// <param name="seq">The journey sequence number.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching journey as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("{seq}")]
    public async Task<ActionResult<JourneyDto>> GetBySeq(int seq, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var journey = await _context.Journeys
            .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq, cancellationToken);

        if (journey is null)
            return NotFound();

        return Ok(_mapper.Map(journey, _service));
    }
    /// <summary>Return a journey by its ID within the project scope.</summary>
    /// <param name="id">The journey's primary key.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching journey as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("by-id/{id}")]
    public async Task<ActionResult<JourneyDto>> GetById(int id, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var journey = await _journeyRepo.GetByIdAsync(id, cancellationToken);

        if (journey is null)
            return NotFound();

        var epic = await _epicRepo.GetByIdAsync(journey.EpicId, cancellationToken);
        if (epic is null)
            return NotFound();

        var promise = await _context.Promises
            .FirstOrDefaultAsync(p => p.Id == epic.ProductPromiseId && p.ProjectId == projectEntity.Id, cancellationToken);
        if (promise is null)
            return NotFound();

        return Ok(_mapper.Map(journey, _service));
    }
    /// <summary>Update a journey within the project scope.</summary>
    /// <param name="seq">The journey sequence number.</param>
    /// <param name="dto">The updated journey data.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPut("{seq}")]
    public async Task<IActionResult> Update(int seq, [FromBody] UpdateJourneyRequestDto dto, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (dto is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity, cancellationToken))
            return Forbid();

        var existing = await _context.Journeys
            .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq, cancellationToken);

        if (existing is null)
            return NotFound();

        if (existing.Id != dto.Id)
            return BadRequest();

        existing.Statement = dto.Statement;
        existing.Description = dto.Description;
        existing.EpicId = dto.EpicId;
        existing.SequenceNumber = dto.SequenceNumber;
        existing.DisplayOrder = dto.DisplayOrder;
        existing.StatusColor = dto.StatusColor;
        existing.OwnerId = dto.OwnerId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _service.UpdateAsync(existing, cancellationToken);
        return NoContent();
    }
    /// <summary>Delete a journey by its sequence number.</summary>
    /// <param name="seq">The journey sequence number.</param>
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

        var journey = await _context.Journeys
            .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq, cancellationToken);

        if (journey is null)
            return NotFound();

        var deleted = await _service.DeleteByIdAsync(journey.Id, cancellationToken);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
    /// <summary>Create a journey from a DTO with auto-generated sequence number.</summary>
    /// <param name="request">The journey creation data.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The created journey as a DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost("create")]
    public async Task<ActionResult<JourneyDto>> CreateFromDto([FromBody] CreateJourneyRequestDto request, string owner, string project, CancellationToken cancellationToken = default)
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

        var epic = await _epicRepo.GetByIdAsync(request.EpicId, cancellationToken);

        if (epic is null)
            return NotFound("Epic not found.");

        var promise = await _context.Promises
            .FirstOrDefaultAsync(p => p.Id == epic.ProductPromiseId && p.ProjectId == projectEntity.Id, cancellationToken);
        if (promise is null)
            return NotFound("Epic not found.");

        var nextSeq = await _context.GetNextJourneySequenceAsync(epic.Id, cancellationToken);

        var journey = new Journey
        {
            Statement = request.Statement,
            Description = request.Description,
            EpicId = epic.Id,
            SequenceNumber = nextSeq,
            DisplayOrder = request.DisplayOrder,
            StatusColor = "red"
        };

        await _service.AddAsync(journey, cancellationToken);
        return CreatedAtAction(nameof(GetBySeq), new { owner, project, seq = journey.SequenceNumber }, _mapper.Map(journey, _service));
    }
    /// <summary>Update a journey's description.</summary>
    /// <param name="seq">The journey sequence number.</param>
    /// <param name="request">The description update request.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPatch("{seq}/description")]
    public async Task<ActionResult<JourneyDto>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDto request, string owner, string project, CancellationToken cancellationToken = default)
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

        var journey = await _context.Journeys
            .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq, cancellationToken);

        if (journey is null)
            return NotFound();

        journey.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        journey.UpdatedAt = DateTime.UtcNow;

        await _service.UpdateAsync(journey, cancellationToken);
        return Ok(_mapper.Map(journey, _service));
    }
}
