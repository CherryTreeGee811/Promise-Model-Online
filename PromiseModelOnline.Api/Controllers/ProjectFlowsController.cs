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
    [Route("api/projects/{owner}/{project}/flows")]
    public class ProjectFlowsController : ProjectScopedControllerBase
    {
        private readonly IGenericService<Flow> _service;
        private readonly IGenericMapper<Flow, FlowDTO> _mapper;
        private readonly IPromiseModelOnlineContext _context;

        /// <summary>Initializes a new instance of the <see cref="ProjectFlowsController"/> class.</summary>
        /// <param name="context">The database context for data access.</param>
        /// <param name="mapper">The mapper for converting between entities and DTOs.</param>
        /// <param name="projectService">The service for project operations.</param>
        /// <param name="service">The service for business logic operations.</param>
        public ProjectFlowsController(
            IGenericService<Flow> service,
            IGenericMapper<Flow, FlowDTO> mapper,
            IPromiseModelOnlineContext context,
            IProjectService projectService)
            : base(projectService)
        {
            _service = service;
            _mapper = mapper;
            _context = context;
        }
        /// <summary>Return all flows for a project, optionally filtered by journey.</summary>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>A list of flow DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlowDTO>>> GetAll(string owner, string project, [FromQuery] int? journeySeq = null)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            IEnumerable<Flow> flows;

            if (journeySeq.HasValue)
            {
                var journey = await _context.Journeys
                    .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.SequenceNumber == journeySeq.Value);

                if (journey is null)
                    return NotFound("Journey not found.");

                flows = await _context.Flows
                    .Where(f => f.JourneyId == journey.Id)
                    .ToListAsync();
            }
            else
            {
                flows = await _context.Flows
                    .Where(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id)
                    .ToListAsync();
            }

            var result = new List<FlowDTO>();
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
        public async Task<ActionResult<FlowDTO>> GetBySeq(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var flow = await _context.Flows
                .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq);

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
        public async Task<ActionResult<FlowDTO>> GetById(int id, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var flow = await _context.Flows
                .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.Id == id);

            if (flow is null)
                return NotFound();

            return Ok(_mapper.Map(flow, _service));
        }
        /// <summary>Update a flow within the project scope.</summary>
        /// <param name="seq">The flow sequence number.</param>
        /// <param name="entity">The updated flow entity.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPut("{seq}")]
        public async Task<IActionResult> Update(int seq, [FromBody] Flow entity, string owner, string project)
        {
            if (entity is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var existing = await _context.Flows
                .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq);

            if (existing is null)
                return NotFound();

            if (existing.Id != entity.Id)
                return BadRequest();

            await _service.UpdateAsync(entity);
            return NoContent();
        }
        /// <summary>Delete a flow by its sequence number.</summary>
        /// <param name="seq">The flow sequence number.</param>
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

            var flow = await _context.Flows
                .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq);

            if (flow is null)
                return NotFound();

            var deleted = await _service.DeleteByIdAsync(flow.Id);
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
        public async Task<ActionResult<FlowDTO>> CreateFromDto([FromBody] CreateFlowRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var journey = await _context.Journeys
                .FirstOrDefaultAsync(j => j.Epic.ProductPromise.ProjectId == projectEntity.Id && j.Id == request.JourneyId);

            if (journey is null)
                return NotFound("Journey not found.");

            var nextSeq = await _context.GetNextFlowSequenceAsync(journey.Id);

            var flow = new Flow
            {
                Statement = request.Statement,
                Description = request.Description,
                JourneyId = journey.Id,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _service.AddAsync(flow);
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
        public async Task<ActionResult<FlowDTO>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var flow = await _context.Flows
                .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == seq);

            if (flow is null)
                return NotFound();

            flow.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            flow.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(flow);
            return Ok(_mapper.Map(flow, _service));
        }
    }
}
