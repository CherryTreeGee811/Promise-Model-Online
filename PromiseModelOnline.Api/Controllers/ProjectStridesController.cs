using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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

/// <summary>CRUD endpoints for strides within a project.</summary>
/// <param name="context">The database context for data access.</param>
/// <param name="logger">The logger for audit and error events.</param>
/// <param name="mapper">The mapper for converting between entities and DTOs.</param>
/// <param name="momentService">The service for moment operations.</param>
/// <param name="projectService">The service for project operations.</param>
/// <param name="strideService">The service for stride operations.</param>
[Route("api/projects/{owner}/{project}/strides")]
public class ProjectStridesController(
    IStrideService strideService,
    IMomentService momentService,
    IGenericMapper<Stride, StrideDto> mapper,
    IPromiseModelOnlineContext context,
    IProjectService projectService,
    ILogger<ProjectStridesController> logger) : ProjectScopedControllerBase(projectService)
{
    private readonly IStrideService _strideService = strideService;
    private readonly IMomentService _momentService = momentService;
    private readonly IGenericMapper<Stride, StrideDto> _mapper = mapper;
    private readonly IPromiseModelOnlineContext _context = context;
    private readonly ILogger<ProjectStridesController> _logger = logger;

    /// <summary>Return all strides for a project, optionally filtered by iteration.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <param name="iterationId">Optional iteration ID to filter by.</param>
    /// <returns>A list of stride DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StrideDto>>> GetAll(string owner, string project, [FromQuery] int? iterationId = null)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null)
            return NotFound();

        IEnumerable<Stride> strides;

        if (iterationId.HasValue)
        {
            var iteration = await _context.Iterations
                .FirstOrDefaultAsync(i => i.ProjectId == projectEntity.Id && i.Id == iterationId.Value);

            if (iteration is null)
                return NotFound("Iteration not found.");

            strides = await _strideService.GetStridesByIterationAsync(iterationId.Value);
        }
        else
        {
            strides = await _context.Strides
                .Where(s => s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id)
                .ToListAsync();
        }

        var result = new List<StrideDto>();
        foreach (var stride in strides)
            result.Add(_mapper.Map(stride, _strideService));

        return Ok(result);
    }
    /// <summary>Return a specific stride by ID within the project scope.</summary>
    /// <param name="id">The stride's primary key.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The matching stride as a DTO.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("by-id/{id}")]
    public async Task<ActionResult<StrideDto>> GetById(int id, string owner, string project)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null)
            return NotFound();

        var stride = await _context.Strides
            .FirstOrDefaultAsync(s => s.Id == id && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);

        if (stride is null)
            return NotFound();

        return Ok(_mapper.Map(stride, _strideService));
    }
    /// <summary>Create a new stride within the project scope.</summary>
    /// <param name="entity">The stride entity to create.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The created stride as a DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost]
    public async Task<ActionResult<StrideDto>> Create([FromBody] Stride entity, string owner, string project)
    {
        if (entity is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null)
            return NotFound();

        if (entity.IterationId.HasValue)
        {
            var iteration = await _context.Iterations
                .FirstOrDefaultAsync(i => i.ProjectId == projectEntity.Id && i.Id == entity.IterationId.Value);

            if (iteration is null)
                return NotFound("Iteration not found.");
        }

        await _strideService.AddAsync(entity);
        return CreatedAtAction(nameof(GetById), new { owner, project, id = entity.Id }, _mapper.Map(entity, _strideService));
    }
    /// <summary>Complete a stride and progress unfinished moments.</summary>
    /// <param name="id">The stride ID.</param>
    /// <param name="request">The stride update request.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPatch("{id}")]
    public async Task<ActionResult> UpdateStride(int id, [FromBody] UpdateStrideRequestDto request, string owner, string project)
    {
        if (request is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null)
            return NotFound();

        var stride = await _context.Strides
            .FirstOrDefaultAsync(s => s.Id == id && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);

        if (stride is null)
            return NotFound();

        try
        {
            await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);

            _logger.LogInformation(
                "Progressed unfinished moments for stride {StrideId} via PATCH",
                id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update stride {StrideId}", id);
            return BadRequest("The stride could not be updated.");
        }
    }
    /// <summary>Manually trigger progression of unfinished moments from a stride.</summary>
    /// <param name="id">The stride ID.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>NoContent on success.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost("{id}/progress")]
    public async Task<ActionResult> ProgressStride(int id, string owner, string project)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);
        if (projectEntity is null)
            return NotFound();

        var stride = await _context.Strides
            .FirstOrDefaultAsync(s => s.Id == id && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);

        if (stride is null)
            return NotFound();

        try
        {
            await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to progress stride {StrideId}", id);
            return BadRequest("The stride could not be progressed.");
        }
    }
}
