using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for moment CRUD with stride assignment, status updates, and owner management.</summary>
    /// <remarks>
    ///   Route disabled — use project-scoped controllers instead. Provides filtered <c>GetAll</c> by
    ///   <c>strideId</c>, <c>flowId</c>, or <c>iterationId</c> query parameters. All write operations
    ///   verify <see cref="PermissionLevel.Edit"/> on the moment's project.
    /// </remarks>
    [Route("__disabled__/{controller}")]
    public class MomentsController : GenericController<Moment, MomentDTO>
    {
        private readonly IMomentService _momentService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly IPromiseModelOnlineContext _context;
        private readonly ILogger<MomentsController> _logger;

        /// <param name="context">The database context for data access.</param>
        /// <param name="logger">The logger for audit and error events.</param>
        /// <param name="mapper">The mapper for converting between entities and DTOs.</param>
        /// <param name="permissionService">The service for permission validation.</param>
        /// <param name="service">The service for business logic operations.</param>
        /// <param name="userRepository">The repository for user data access.</param>
        public MomentsController(
            IMomentService service,
            IGenericMapper<Moment, MomentDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService,
            IPromiseModelOnlineContext context,
            ILogger<MomentsController> logger)
            : base(service, mapper)
        {
            _momentService = service;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _context = context;
            _logger = logger;
        }
        /// <summary>Create a moment from a DTO with auto-generated sequence number.</summary>
        /// <param name="request">The moment creation data.</param>
        /// <returns>The created moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<MomentDTO>> CreateFromDto([FromBody] CreateMomentRequestDTO request)
        {
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var nextSeq = await _context.GetNextMomentSequenceAsync(request.FlowId);

            var moment = new Moment
            {
                Statement = request.Statement,
                Description = request.Description,
                FlowId = request.FlowId,
                Type = request.Type,
                Status = request.Status,
                EffortEstimate = request.EffortEstimate,
                AssignedStrideId = request.AssignedStrideId,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = StatusColorRules.FromMomentStatus(request.Status),
            };

            await _momentService.AddAsync(moment);
            return CreatedAtAction(nameof(GetById), new { id = moment.Id }, _mapper.Map(moment, _service));
        }

        /// <summary>Return moments with optional stride, flow, or iteration filters.</summary>
        /// <returns>A list of moment DTOs with optional filters applied.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<MomentDTO>>> GetAll()
        {
            IEnumerable<Moment> moments;

            var strideIdStr = Request.Query["strideId"];
            var flowIdStr = Request.Query["flowId"];
            var iterationIdStr = Request.Query["iterationId"];
            var unassignedStr = Request.Query["unassigned"];

            if (!string.IsNullOrEmpty(strideIdStr) && int.TryParse(strideIdStr, out int strideId))
                moments = await _momentService.GetMomentsByStrideAsync(strideId);
            else if (!string.IsNullOrEmpty(flowIdStr) && int.TryParse(flowIdStr, out int flowId))
                moments = await _momentService.GetMomentsByFlowAsync(flowId);
            else if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
            {
                bool unassignedOnly = unassignedStr == "true";
                moments = await _momentService.GetMomentsByIterationAsync(iterationId, unassignedOnly);
            }
            else
                moments = await _momentService.GetAllAsync();

            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _service));

            return Ok(result);
        }

        /// <summary>Assign a moment to a stride or move it to the backlog.</summary>
        /// <param name="id">The moment ID.</param>
        /// <param name="request">The stride assignment request.</param>
        /// <returns>The updated moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/stride-assignment")]
        public async Task<ActionResult<MomentDTO>> AssignMomentToStride(
            int id,
            [FromBody] UpdateMomentStrideAssignmentRequest request)
        {
            if (!await UserCanEditMomentAsync(id)) return Forbid();
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.AssignMomentToStrideAsync(id, request.StrideId);
                _logger.LogInformation("User assigned Moment {MomentId} to Stride {StrideId}", id, request.StrideId);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Moment {MomentId} not found for stride assignment", id);
                return NotFound("Moment not found.");
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Stride assignment failed for moment {MomentId}", id);
                return BadRequest("The moment could not be assigned to the stride.");
            }
        }

        /// <summary>Update a moment's status with business rule validation.</summary>
        /// <param name="id">The moment ID.</param>
        /// <param name="request">The status update request.</param>
        /// <returns>The updated moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentStatus(
            int id,
            [FromBody] UpdateMomentStatusRequest request)
        {
            if (!await UserCanEditMomentAsync(id)) return Forbid();
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.UpdateMomentStatusAsync(id, request.NewStatus);
                _logger.LogInformation("User updated Moment {MomentId} status to {NewStatus}", id, request.NewStatus);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Moment not found in moments operation");
                return NotFound("Moment not found.");
            }
        }

        /// <summary>Update a moment's description.</summary>
        /// <param name="id">The moment ID.</param>
        /// <param name="request">The description update request.</param>
        /// <returns>The updated moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/description")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentDescription(
            int id,
            [FromBody] UpdateDescriptionRequestDTO request)
        {
            if (!await UserCanEditMomentAsync(id)) return Forbid();
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.GetByIdAsync(id);
                if (moment is null) return NotFound($"Moment with ID {id} not found.");

                moment.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
                moment.UpdatedAt = DateTime.UtcNow;
                await _momentService.UpdateAsync(moment);

                _logger.LogInformation("User updated Moment {MomentId} description", id);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Moment not found in moments operation");
                return NotFound("Moment not found.");
            }
        }

        /// <summary>Update a moment's effort estimate.</summary>
        /// <param name="id">The moment ID.</param>
        /// <param name="request">The estimate update request.</param>
        /// <returns>The updated moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/estimate")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentEstimate(
            int id,
            [FromBody] UpdateMomentEstimateRequest request)
        {
            if (!await UserCanEditMomentAsync(id)) return Forbid();
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.UpdateMomentEstimateAsync(id, request.Estimate);
                _logger.LogInformation("User updated Moment {MomentId} estimate to {Estimate}", id, request.Estimate);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Moment not found in moments operation");
                return NotFound("Moment not found.");
            }
        }

        /// <summary>Update a moment's type classification.</summary>
        /// <param name="id">The moment ID.</param>
        /// <param name="request">The type update request.</param>
        /// <returns>The updated moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/type")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentType(
            int id,
            [FromBody] UpdateMomentTypeRequest request)
        {
            if (!await UserCanEditMomentAsync(id)) return Forbid();
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.GetByIdAsync(id);
                if (moment is null) return NotFound($"Moment with ID {id} not found.");

                moment.Type = request.NewType;
                moment.UpdatedAt = DateTime.UtcNow;
                await _momentService.UpdateAsync(moment);

                _logger.LogInformation("User updated Moment {MomentId} type to {NewType}", id, request.NewType);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Moment not found in moments operation");
                return NotFound("Moment not found.");
            }
        }

        /// <summary>Assign or unassign an owner to a moment.</summary>
        /// <param name="id">The moment ID.</param>
        /// <param name="request">The owner assignment request.</param>
        /// <returns>The updated moment as a DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}/owner")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentOwner(
            int id,
            [FromBody] UpdateMomentOwnerRequest request)
        {
            if (!await UserCanEditMomentAsync(id)) return Forbid();
            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.AssignOwnerAsync(id, request.UserId);
                _logger.LogInformation("User assigned Moment {MomentId} to Owner {OwnerId}", id, request.UserId);
                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Moment not found in moments operation");
                return NotFound("Moment not found.");
            }
        }

        /// <summary>Resolve the current user from JWT claims.</summary>
        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;
            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }

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
