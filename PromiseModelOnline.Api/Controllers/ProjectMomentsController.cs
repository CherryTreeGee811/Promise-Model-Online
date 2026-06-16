using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for moment CRUD within a project scope, with status, estimate, owner, and stride operations.</summary>
    [Route("api/projects/{owner}/{project}/moments")]
    public class ProjectMomentsController : ProjectScopedControllerBase
    {
        private readonly IMomentService _momentService;
        private readonly IGenericMapper<Moment, MomentDTO> _mapper;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly IPromiseModelOnlineContext _context;
        private readonly ILogger<ProjectMomentsController> _logger;

        /// <param name="context">The database context for data access.</param>
        /// <param name="logger">The logger for audit and error events.</param>
        /// <param name="mapper">The mapper for converting between entities and DTOs.</param>
        /// <param name="permissionService">The service for permission validation.</param>
        /// <param name="projectService">The service for project operations.</param>
        /// <param name="service">The service for moment business logic operations.</param>
        /// <param name="userRepository">The repository for user data access.</param>
        public ProjectMomentsController(
            IMomentService service,
            IGenericMapper<Moment, MomentDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService,
            IPromiseModelOnlineContext context,
            ILogger<ProjectMomentsController> logger,
            IProjectService projectService)
            : base(projectService)
        {
            _momentService = service;
            _mapper = mapper;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _context = context;
            _logger = logger;
        }

        /// <summary>Return a moment by its sequence number within the project.</summary>
        /// <param name="seq">The moment's sequence number within its flow.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the matching moment as a DTO.</response>
        /// <response code="404">No moment with the given sequence number exists in the project.</response>
        [Authorize(Policy = "projects.read")]
        [HttpGet("{seq}")]
        public async Task<ActionResult<MomentDTO>> GetBySeq(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            return Ok(_mapper.Map(moment, _momentService));
        }

        /// <summary>Return a moment by its ID within the project scope.</summary>
        /// <param name="id">The moment's primary key.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the matching moment as a DTO.</response>
        /// <response code="404">No moment with the given ID exists in the project.</response>
        [Authorize(Policy = "projects.read")]
        [HttpGet("by-id/{id}")]
        public async Task<ActionResult<MomentDTO>> GetById(int id, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.Id == id);

            if (moment is null)
                return NotFound();

            return Ok(_mapper.Map(moment, _momentService));
        }

        /// <summary>Update a moment within the project scope.</summary>
        /// <param name="seq">The moment's sequence number within its flow.</param>
        /// <param name="entity">The updated moment entity.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="204">The moment was updated successfully.</response>
        /// <response code="400">The entity ID does not match the sequence number.</response>
        /// <response code="404">The moment or project was not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPut("{seq}")]
        public async Task<IActionResult> Update(int seq, [FromBody] Moment entity, string owner, string project)
        {
            if (entity is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var existing = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (existing is null)
                return NotFound();

            if (existing.Id != entity.Id)
                return BadRequest();

            await _momentService.UpdateAsync(entity);
            return NoContent();
        }

        /// <summary>Delete a moment by its sequence number.</summary>
        /// <param name="seq">The moment's sequence number to delete.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="204">The moment was deleted successfully.</response>
        /// <response code="404">The moment or project was not found.</response>
        /// <returns>NoContent on success, or NotFound if not found.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpDelete("{seq}")]
        public async Task<IActionResult> Delete(int seq, string owner, string project)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            var deleted = await _momentService.DeleteByIdAsync(moment.Id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        /// <summary>Create a moment from a DTO with auto-generated sequence number.</summary>
        /// <param name="request">The moment creation data.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="201">Returns the created moment with a Location header.</response>
        /// <response code="400">Invalid request data.</response>
        /// <response code="404">Project or flow not found.</response>
        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<MomentDTO>> CreateFromDto([FromBody] CreateMomentRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var flow = await _context.Flows
                .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.Id == request.FlowId);

            if (flow is null)
                return NotFound("Flow not found.");

            var nextSeq = await _context.GetNextMomentSequenceAsync(flow.Id);

            var moment = new Moment
            {
                Statement = request.Statement,
                Description = request.Description,
                FlowId = flow.Id,
                Type = request.Type,
                Status = request.Status,
                EffortEstimate = request.EffortEstimate,
                AssignedStrideId = request.AssignedStrideId,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = StatusColorRules.FromMomentStatus(request.Status),
            };

            await _momentService.AddAsync(moment);
            return CreatedAtAction(nameof(GetBySeq), new { owner, project, seq = moment.SequenceNumber }, _mapper.Map(moment, _momentService));
        }

        /// <summary>Return moments for a project with optional stride, flow sequence, or iteration filters.</summary>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns matching moments as DTOs.</response>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MomentDTO>>> GetAll(string owner, string project,
            [FromQuery] int? strideId = null, [FromQuery] int? flowSeq = null,
            [FromQuery] int? iterationId = null, [FromQuery] bool? unassigned = null)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            IEnumerable<Moment> moments;

            if (strideId.HasValue)
            {
                var stride = await _context.Strides
                    .FirstOrDefaultAsync(s => s.Id == strideId.Value && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);
                if (stride is null)
                    return NotFound("Stride not found.");

                moments = await _momentService.GetMomentsByStrideAsync(strideId.Value);
            }
            else if (flowSeq.HasValue)
            {
                var flow = await _context.Flows
                    .FirstOrDefaultAsync(f => f.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && f.SequenceNumber == flowSeq.Value);

                if (flow is null)
                    return NotFound("Flow not found.");

                moments = await _momentService.GetMomentsByFlowAsync(flow.Id);
            }
            else if (iterationId.HasValue)
            {
                bool unassignedOnly = unassigned == true;
                var iteration = await _context.Iterations
                    .FirstOrDefaultAsync(i => i.ProjectId == projectEntity.Id && i.Id == iterationId.Value);
                if (iteration is null)
                    return NotFound("Iteration not found.");

                moments = await _momentService.GetMomentsByIterationAsync(iterationId.Value, unassignedOnly);
            }
            else
            {
                moments = await _context.Moments
                    .Where(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id)
                    .ToListAsync();
            }

            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _momentService));

            return Ok(result);
        }

        /// <summary>Assign a moment to a stride or move it to the backlog within the project scope.</summary>
        /// <param name="seq">The moment's sequence number.</param>
        /// <param name="request">The stride assignment request containing the target stride ID.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the updated moment.</response>
        /// <response code="400">Invalid request or stride not associated with an iteration.</response>
        /// <response code="403">User does not have Edit permission.</response>
        /// <response code="404">Moment, stride, or project not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/stride-assignment")]
        public async Task<ActionResult<MomentDTO>> AssignMomentToStride(int seq, [FromBody] UpdateMomentStrideAssignmentRequest request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var updated = await _momentService.AssignMomentToStrideAsync(moment.Id, request.StrideId);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    moment.Id,
                    DateTime.UtcNow,
                    new { StrideId = request.StrideId });

                return Ok(_mapper.Map(updated, _momentService));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>Update a moment's status with hierarchy propagation.</summary>
        /// <param name="seq">The moment's sequence number.</param>
        /// <param name="request">The status update request containing the new status.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the updated moment.</response>
        /// <response code="403">User does not have Edit permission.</response>
        /// <response code="404">Moment or project not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/status")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentStatus(int seq, [FromBody] UpdateMomentStatusRequest request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var updated = await _momentService.UpdateMomentStatusAsync(moment.Id, request.NewStatus);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    moment.Id,
                    DateTime.UtcNow,
                    new { NewStatus = request.NewStatus.ToString() });

                return Ok(_mapper.Map(updated, _momentService));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>Update a moment's description.</summary>
        /// <param name="seq">The moment's sequence number.</param>
        /// <param name="request">The description update request.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the updated moment.</response>
        /// <response code="403">User does not have Edit permission.</response>
        /// <response code="404">Moment or project not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/description")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentDescription(int seq, [FromBody] UpdateDescriptionRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                moment.Description = string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim();
                moment.UpdatedAt = DateTime.UtcNow;

                await _momentService.UpdateAsync(moment);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    moment.Id,
                    DateTime.UtcNow,
                    new { Description = request.Description });

                return Ok(_mapper.Map(moment, _momentService));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>Update a moment's effort estimate.</summary>
        /// <param name="seq">The moment's sequence number.</param>
        /// <param name="request">The estimate update request.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the updated moment.</response>
        /// <response code="403">User does not have Edit permission.</response>
        /// <response code="404">Moment or project not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/estimate")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentEstimate(int seq, [FromBody] UpdateMomentEstimateRequest request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var updated = await _momentService.UpdateMomentEstimateAsync(moment.Id, request.Estimate);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    moment.Id,
                    DateTime.UtcNow,
                    new { Estimate = request.Estimate?.ToString() });

                return Ok(_mapper.Map(updated, _momentService));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>Update a moment's type classification.</summary>
        /// <param name="seq">The moment's sequence number.</param>
        /// <param name="request">The type update request.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the updated moment.</response>
        /// <response code="403">User does not have Edit permission.</response>
        /// <response code="404">Moment or project not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/type")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentType(int seq, [FromBody] UpdateMomentTypeRequest request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                moment.Type = request.NewType;
                moment.UpdatedAt = DateTime.UtcNow;

                await _momentService.UpdateAsync(moment);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    moment.Id,
                    DateTime.UtcNow,
                    new { NewType = request.NewType.ToString() });

                return Ok(_mapper.Map(moment, _momentService));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>Assign or unassign an owner to a moment.</summary>
        /// <param name="seq">The moment's sequence number.</param>
        /// <param name="request">The owner assignment request containing the user ID.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <response code="200">Returns the updated moment.</response>
        /// <response code="403">User does not have Edit permission.</response>
        /// <response code="404">Moment or project not found.</response>
        /// <returns>NoContent on success, or BadRequest if IDs mismatch.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/owner")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentOwner(int seq, [FromBody] UpdateMomentOwnerRequest request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == seq);

            if (moment is null)
                return NotFound();

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var updated = await _momentService.AssignOwnerAsync(moment.Id, request.UserId);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    moment.Id,
                    DateTime.UtcNow,
                    new { OwnerUserId = request.UserId });

                return Ok(_mapper.Map(updated, _momentService));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>Resolve the current user from JWT claims, auto-provisioning if needed.</summary>
        /// <returns>The current user, or <c>null</c> if the email claim is missing.</returns>
        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }

        /// <summary>Check if the current user has Edit permission on the moment's project.</summary>
        /// <param name="momentId">The moment ID to check permissions for.</param>
        /// <returns><c>true</c> if the user has Edit permission; otherwise <c>false</c>.</returns>
        private async Task<bool> UserCanEditMomentAsync(int momentId)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return false;

            var projectId = await _momentService.GetProjectIdForMomentAsync(momentId);
            if (projectId is null) return false;

            var level = await _permissionService.GetUserPermissionAsync(user.Id, projectId.Value);
            return level == PermissionLevel.Edit;
        }
    }
}
