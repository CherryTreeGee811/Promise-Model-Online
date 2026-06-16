using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects/{owner}/{project}/promises")]
    public class ProjectPromisesController : ProjectScopedControllerBase
    {
        private readonly IGenericService<Promise> _service;
        private readonly IGenericMapper<Promise, PromiseDTO> _mapper;
        private readonly IMomentService _momentService;
        private readonly IPromiseModelOnlineContext _context;

        /// <summary>Initializes a new instance of the <see cref="ProjectPromisesController"/> class.</summary>
        /// <param name="context">The database context for data access.</param>
        /// <param name="mapper">The mapper for converting between entities and DTOs.</param>
        /// <param name="momentService">The service for moment operations.</param>
        /// <param name="projectService">The service for project operations.</param>
        /// <param name="service">The service for business logic operations.</param>
        public ProjectPromisesController(
            IGenericService<Promise> service,
            IGenericMapper<Promise, PromiseDTO> mapper,
            IMomentService momentService,
            IPromiseModelOnlineContext context,
            IProjectService projectService)
            : base(projectService)
        {
            _service = service;
            _mapper = mapper;
            _momentService = momentService;
            _context = context;
        }
        /// <summary>Return a promise by its sequence number within the project.</summary>
        /// <param name="seq">The promise sequence number.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The matching promise as a DTO.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{seq}")]
        public async Task<ActionResult<PromiseDTO>> GetBySeq(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == seq);

            if (promise is null)
                return NotFound();

            return Ok(_mapper.Map(promise, _service));
        }
        /// <summary>Return a promise by its ID within the project scope.</summary>
        /// <param name="id">The promise's primary key.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The matching promise as a DTO.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet("by-id/{id}")]
        public async Task<ActionResult<PromiseDTO>> GetById(int id, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.Id == id);

            if (promise is null)
                return NotFound();

            return Ok(_mapper.Map(promise, _service));
        }
        /// <summary>Update a promise within the project scope.</summary>
        /// <param name="seq">The promise sequence number.</param>
        /// <param name="entity">The updated promise entity.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPut("{seq}")]
        public async Task<IActionResult> Update(int seq, [FromBody] Promise entity, string owner, string project)
        {
            if (entity is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var existing = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == seq);

            if (existing is null)
                return NotFound();

            if (existing.Id != entity.Id)
                return BadRequest();

            await _service.UpdateAsync(entity);
            return NoContent();
        }
        /// <summary>Delete a promise by its sequence number.</summary>
        /// <param name="seq">The promise sequence number.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpDelete("{seq}")]
        public async Task<IActionResult> Delete(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == seq);

            if (promise is null)
                return NotFound();

            var deleted = await _service.DeleteByIdAsync(promise.Id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
        /// <summary>Create a promise from a DTO with auto-generated sequence number.</summary>
        /// <param name="request">The promise creation data.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The created promise as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<PromiseDTO>> CreateFromDto([FromBody] CreatePromiseRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var nextSeq = await _context.GetNextPromiseSequenceAsync(projectEntity.Id);

            var promise = new Promise
            {
                Statement = request.Statement,
                Description = request.Description,
                ProjectId = projectEntity.Id,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red",
            };

            await _service.AddAsync(promise);
            return CreatedAtAction(nameof(GetBySeq), new { owner, project, seq = promise.SequenceNumber }, _mapper.Map(promise, _service));
        }
        /// <summary>Update a promise's description.</summary>
        /// <param name="seq">The promise sequence number.</param>
        /// <param name="request">The description update request.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/description")]
        public async Task<ActionResult<PromiseDTO>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == seq);

            if (promise is null)
                return NotFound();

            promise.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            promise.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(promise);
            return Ok(_mapper.Map(promise, _service));
        }
        /// <summary>Get the total effort estimate for all moments under a promise.</summary>
        /// <param name="seq">The promise sequence number.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The total effort value.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{seq}/total-effort")]
        public async Task<ActionResult<int>> GetTotalEffort(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == seq);

            if (promise is null)
                return NotFound();

            var effort = await _momentService.GetTotalEffortForPromiseAsync(promise.Id);
            return Ok(effort);
        }
    }
}
