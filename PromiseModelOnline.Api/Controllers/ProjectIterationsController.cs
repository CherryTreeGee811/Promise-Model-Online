using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using PromiseModelOnline.Api.BusinessLogic.Interfaces;

using PromiseModelOnline.Api.DTOs;

using PromiseModelOnline.Api.Mappers.Interfaces;

using PromiseModelOnline.Api.Models;

using System.Collections.Generic;

using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers;


/// <summary>REST controller for iteration CRUD within a project scope with burndown support.</summary>
/// <remarks>Initializes a new instance of the <see cref="ProjectIterationsController"/> class.</remarks>
/// <param name="iterationService">The service for iteration-specific operations.</param>
/// <param name="mapper">The mapper for converting between entities and DTOs.</param>
/// <param name="momentService">The service for moment operations.</param>
/// <param name="projectService">The service for project operations.</param>
/// <param name="service">The service for generic business logic operations.</param>
[Route("api/projects/{owner}/{project}/iterations")]
public class ProjectIterationsController(

    IGenericService<Iteration> service,

    IGenericMapper<Iteration, IterationDto> mapper,

    IIterationService iterationService,

    IMomentService momentService,

    IProjectService projectService) : ProjectScopedControllerBase(projectService)
{
    private readonly IGenericService<Iteration> _service = service;
    private readonly IGenericMapper<Iteration, IterationDto> _mapper = mapper;

    private readonly IIterationService _iterationService = iterationService;

    private readonly IMomentService _momentService = momentService;



    /// <summary>Return all iterations for a project.</summary>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>A list of iteration DTOs.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IterationDto>>> GetAll(string owner, string project)

    {

        var projectEntity = await ResolveProjectAsync(owner, project);

        if (projectEntity is null)

            return NotFound();



        var iterations = await _iterationService.GetIterationsByProjectAsync(projectEntity.Id);



        var result = new List<IterationDto>();

        foreach (var iter in iterations)

            result.Add(_mapper.Map(iter, _service));



        return Ok(result);

    }



    /// <summary>Create a new iteration within the project scope.</summary>
    /// <param name="entity">The iteration entity to create.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <returns>The created iteration DTO.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost]
    public async Task<ActionResult<IterationDto>> Create([FromBody] Iteration entity, string owner, string project)

    {

        if (entity is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);

        if (projectEntity is null)

            return NotFound();

        if (!await RequireProjectEditPermissionAsync(projectEntity))

            return Forbid();

        entity.ProjectId = projectEntity.Id;



        await _service.AddAsync(entity);

        return CreatedAtAction(nameof(GetAll), new { owner, project }, _mapper.Map(entity, _service));

    }



    /// <summary>Get burndown chart data for an iteration.</summary>
    /// <param name="id">The iteration ID.</param>
    /// <param name="owner">The project owner's URL-safe slug.</param>
    /// <param name="project">The project's URL-safe slug.</param>
    /// <response code="200">Returns burndown data points ordered by date.</response>
    /// <returns>A list of burndown data points.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet("{id}/burndown")]
    public async Task<ActionResult<List<BurndownPointDto>>> GetIterationBurndown(int id, string owner, string project)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var projectEntity = await ResolveProjectAsync(owner, project);

        if (projectEntity is null)

            return NotFound();



        var iteration = await _iterationService.GetByIdAsync(id);

        if (iteration is null || iteration.ProjectId != projectEntity.Id)

            return NotFound();



        var points = await _momentService.GetIterationBurndownAsync(id);

        return Ok(points);

    }

}
