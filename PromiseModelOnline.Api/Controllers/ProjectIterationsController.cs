using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;

using PromiseModelOnline.Api.BusinessLogic.Interfaces;

using PromiseModelOnline.Api.DTOs;

using PromiseModelOnline.Api.Mappers.Interfaces;

using PromiseModelOnline.Api.Models;

using System.Collections.Generic;

using System.Threading.Tasks;

/// <summary>REST controller for iteration CRUD within a project scope with burndown support.</summary>



namespace PromiseModelOnline.Api.Controllers

{

    /// <summary>REST controller for iteration CRUD within a project scope with burndown support.</summary>
    [Route("api/projects/{owner}/{project}/iterations")]
    public class ProjectIterationsController : ProjectScopedControllerBase
    {
        private readonly IGenericService<Iteration> _service;
        private readonly IGenericMapper<Iteration, IterationDTO> _mapper;

        private readonly IIterationService _iterationService;

        private readonly IMomentService _momentService;



        public ProjectIterationsController(

            IGenericService<Iteration> service,

            IGenericMapper<Iteration, IterationDTO> mapper,

            IIterationService iterationService,

            IMomentService momentService,

            IProjectService projectService)

            : base(projectService)

        {

            _service = service;

            _mapper = mapper;

            _iterationService = iterationService;

            _momentService = momentService;

        }



        /// <summary>Return all iterations for a project.</summary>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>A list of iteration DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IterationDTO>>> GetAll(string owner, string project)

        {

            var projectEntity = await ResolveProjectAsync(owner, project);

            if (projectEntity is null)

                return NotFound();



            var iterations = await _iterationService.GetIterationsByProjectAsync(projectEntity.Id);



            var result = new List<IterationDTO>();

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
        public async Task<ActionResult<IterationDTO>> Create([FromBody] Iteration entity, string owner, string project)

        {

            var projectEntity = await ResolveProjectAsync(owner, project);

            if (projectEntity is null)

                return NotFound();



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
        public async Task<ActionResult<List<BurndownPointDTO>>> GetIterationBurndown(int id, string owner, string project)
        {
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

}
