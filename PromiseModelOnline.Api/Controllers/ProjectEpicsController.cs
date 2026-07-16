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

/// <summary>CRUD endpoints for epics within a project.</summary>
/// <remarks>Initializes a new instance of the <see cref="ProjectEpicsController"/> class.</remarks>
/// <param name="context">The database context for data access.</param>
/// <param name="mapper">The mapper for converting between entities and DTOs.</param>
/// <param name="projectService">The service for project operations.</param>
/// <param name="service">The service for business logic operations.</param>
[Route("api/projects/{owner}/{project}/epics")]
public class ProjectEpicsController(
    IGenericService<Epic> service,
    IGenericMapper<Epic, EpicDto> mapper,
    IPromiseModelOnlineContext context,
    IProjectService projectService,
    IEpicRepository epicRepo,
    IGenericRepository<Promise> promiseRepo) : ProjectScopedControllerBase(projectService)
{
    private readonly IGenericService<Epic> _service = service;
    private readonly IGenericMapper<Epic, EpicDto> _mapper = mapper;
    private readonly IPromiseModelOnlineContext _context = context;
    private readonly IEpicRepository _epicRepo = epicRepo;
    private readonly IGenericRepository<Promise> _promiseRepo = promiseRepo;

    /// <summary>Return all epics for a project, optionally filtered by promise.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <param name="promiseSeq">Optional promise sequence number to filter by.</param>
    /// <returns>A list of epic DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EpicDto>>> GetAll(string owner, string project, [FromQuery] int? promiseSeq = null, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        IEnumerable<Epic> epics;

        if (promiseSeq.HasValue)
        {
            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == promiseSeq.Value, cancellationToken);

            if (promise is null)
                return NotFound("Promise not found.");

            epics = await _epicRepo.GetEpicsByPromiseAsync(promise.Id, cancellationToken);
        }
        else
        {
            epics = await _context.Epics
                .Where(e => e.ProductPromise.ProjectId == projectEntity.Id)
                .ToListAsync(cancellationToken);
        }

        var result = new List<EpicDto>();
        foreach (var epic in epics)
            result.Add(_mapper.Map(epic, _service));

        return Ok(result);
    }
    /// <summary>Return an epic by its sequence number within the project.</summary>
    /// <param name="seq">The epic sequence number.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching epic as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("{seq}")]
    public async Task<ActionResult<EpicDto>> GetBySeq(int seq, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var epic = await _context.Epics
            .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq, cancellationToken);

        if (epic is null)
            return NotFound();

        return Ok(_mapper.Map(epic, _service));
    }
    /// <summary>Return an epic by its ID within the project scope.</summary>
    /// <param name="id">The epic's primary key.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching epic as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("by-id/{id}")]
    public async Task<ActionResult<EpicDto>> GetById(int id, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var epic = await _epicRepo.GetByIdAsync(id, cancellationToken);

        if (epic is null)
            return NotFound();

        var promise = await _promiseRepo.GetByIdAsync(epic.ProductPromiseId, cancellationToken);
        if (promise is null || promise.ProjectId != projectEntity.Id)
            return NotFound();

        return Ok(_mapper.Map(epic, _service));
    }
    /// <summary>Update an epic within the project scope.</summary>
    /// <param name="seq">The epic sequence number.</param>
    /// <param name="dto">The updated epic data.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPut("{seq}")]
    public async Task<IActionResult> Update(int seq, [FromBody] UpdateEpicRequestDto dto, string owner, string project, CancellationToken cancellationToken = default)
    {
        if (dto is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity, cancellationToken))
            return Forbid();

        var existing = await _context.Epics
            .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq, cancellationToken);

        if (existing is null)
            return NotFound();

        if (existing.Id != dto.Id)
            return BadRequest();

        existing.Statement = dto.Statement;
        existing.Description = dto.Description;
        existing.ProductPromiseId = dto.ProductPromiseId;
        existing.SequenceNumber = dto.SequenceNumber;
        existing.DisplayOrder = dto.DisplayOrder;
        existing.StatusColor = dto.StatusColor;
        existing.OwnerId = dto.OwnerId;
        existing.UpdatedAt = DateTime.UtcNow;

        await _service.UpdateAsync(existing, cancellationToken);
        return NoContent();
    }
    /// <summary>Delete an epic by its sequence number.</summary>
    /// <param name="seq">The epic sequence number.</param>
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

        var epic = await _context.Epics
            .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq, cancellationToken);

        if (epic is null)
            return NotFound();

        var deleted = await _service.DeleteByIdAsync(epic.Id, cancellationToken);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
    /// <summary>Create an epic from a DTO with auto-generated sequence number.</summary>
    /// <param name="request">The epic creation data.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The created epic as a DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost("create")]
    public async Task<ActionResult<EpicDto>> CreateFromDto([FromBody] CreateEpicRequestDto request, string owner, string project, CancellationToken cancellationToken = default)
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

        var promise = await _promiseRepo.GetByIdAsync(request.ProductPromiseId, cancellationToken);

        if (promise is null || promise.ProjectId != projectEntity.Id)
            return NotFound("Promise not found.");

        var nextSeq = await _context.GetNextEpicSequenceAsync(promise.Id, cancellationToken);

        var epic = new Epic
        {
            Statement = request.Statement,
            Description = request.Description,
            ProductPromiseId = promise.Id,
            SequenceNumber = nextSeq,
            DisplayOrder = request.DisplayOrder,
            StatusColor = "red"
        };

        await _service.AddAsync(epic, cancellationToken);
        return CreatedAtAction(nameof(GetBySeq), new { owner, project, seq = epic.SequenceNumber }, _mapper.Map(epic, _service));
    }
    /// <summary>Update an epic's description.</summary>
    /// <param name="seq">The epic sequence number.</param>
    /// <param name="request">The description update request.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPatch("{seq}/description")]
    public async Task<ActionResult<EpicDto>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDto request, string owner, string project, CancellationToken cancellationToken = default)
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

        var epic = await _context.Epics
            .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq, cancellationToken);

        if (epic is null)
            return NotFound();

        epic.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        epic.UpdatedAt = DateTime.UtcNow;

        await _service.UpdateAsync(epic, cancellationToken);
        return Ok(_mapper.Map(epic, _service));
    }
}
