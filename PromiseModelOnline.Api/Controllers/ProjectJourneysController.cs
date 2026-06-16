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
namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects/{owner}/{project}/journeys")]
    public class ProjectJourneysController : ProjectScopedControllerBase
    {
        private readonly IGenericService<Journey> _service;
        private readonly IGenericMapper<Journey, JourneyDto> _mapper;
        private readonly IPromiseModelOnlineContext _context;

        /// <summary>Initializes a new instance of the <see cref="ProjectJourneysController"/> class.</summary>
        /// <param name="context">The database context for data access.</param>
        /// <param name="mapper">The mapper for converting between entities and DTOs.</param>
        /// <param name="projectService">The service for project operations.</param>
        /// <param name="service">The service for business logic operations.</param>
        public ProjectJourneysController(
            IGenericService<Journey> service,
            IGenericMapper<Journey, JourneyDto> mapper,
            IPromiseModelOnlineContext context,
            IProjectService projectService)
            : base(projectService)
        {
            _service = service;
            _mapper = mapper;
            _context = context;
        }
        /// <summary>Return all journeys for a project, optionally filtered by epic.</summary>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <param name="epicSeq">Optional epic sequence number to filter by.</param>
        /// <returns>A list of journey DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JourneyDto>>> GetAll(string owner, string project, [FromQuery] int? epicSeq = null)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            IEnumerable<Journey> journeys;

            if (epicSeq.HasValue)
            {
                var epic = await _context.Epics
                    .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == epicSeq.Value);

                if (epic is null)
                    return NotFound("Epic not found.");

                journeys = await _context.Journeys
                    .Where(j => j.EpicId == epic.Id)
                    .ToListAsync();
            }
            else
            {
                journeys = await _context.Journeys
                    .Where(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id)
                    .ToListAsync();
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
        public async Task<ActionResult<JourneyDto>> GetBySeq(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var journey = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq);

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
        public async Task<ActionResult<JourneyDto>> GetById(int id, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var journey = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.Id == id);

            if (journey is null)
                return NotFound();

            return Ok(_mapper.Map(journey, _service));
        }
        /// <summary>Update a journey within the project scope.</summary>
        /// <param name="seq">The journey sequence number.</param>
        /// <param name="entity">The updated journey entity.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPut("{seq}")]
        public async Task<IActionResult> Update(int seq, [FromBody] Journey entity, string owner, string project)
        {
            if (entity is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var existing = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq);

            if (existing is null)
                return NotFound();

            if (existing.Id != entity.Id)
                return BadRequest();

            await _service.UpdateAsync(entity);
            return NoContent();
        }
        /// <summary>Delete a journey by its sequence number.</summary>
        /// <param name="seq">The journey sequence number.</param>
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

            var journey = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq);

            if (journey is null)
                return NotFound();

            var deleted = await _service.DeleteByIdAsync(journey.Id);
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
        public async Task<ActionResult<JourneyDto>> CreateFromDto([FromBody] CreateJourneyRequestDto request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var epic = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.Id == request.EpicId);

            if (epic is null)
                return NotFound("Epic not found.");

            var nextSeq = await _context.GetNextJourneySequenceAsync(epic.Id);

            var journey = new Journey
            {
                Statement = request.Statement,
                Description = request.Description,
                EpicId = epic.Id,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _service.AddAsync(journey);
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
        public async Task<ActionResult<JourneyDto>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDto request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var journey = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == seq);

            if (journey is null)
                return NotFound();

            journey.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            journey.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(journey);
            return Ok(_mapper.Map(journey, _service));
        }
    }
}
