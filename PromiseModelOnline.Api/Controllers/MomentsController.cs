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
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class MomentsController : GenericController<Moment, MomentDTO>
    {
        private readonly IMomentService _momentService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<MomentsController> _logger;

        public MomentsController(
            IMomentService service,
            IGenericMapper<Moment, MomentDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService,
            ILogger<MomentsController> logger)
            : base(service, mapper)
        {
            _momentService = service;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>
        /// Creates a new moment from a lightweight request DTO.
        /// The client only supplies the parent FlowId; the entity navigation property stays server-owned.
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<MomentDTO>> CreateFromDto([FromBody] CreateMomentRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var moment = new Moment
            {
                Statement = request.Statement,
                Description = request.Description,
                FlowId = request.FlowId,
                Type = request.Type,
                Status = request.Status,
                DisplayOrder = request.DisplayOrder,
                StatusColor = StatusColorRules.FromMomentStatus(request.Status),
            };

            await _momentService.AddAsync(moment);
            return CreatedAtAction(nameof(GetById), new { id = moment.Id }, _mapper.Map(moment, _service));
        }

        /// <summary>
        /// Returns moments filtered by optional query parameters:
        /// strideId, flowId, iterationId (with unassigned flag)
        /// </summary>
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<MomentDTO>>> GetAll()
        {
            IEnumerable<Moment> moments;

            var strideIdStr = Request.Query["strideId"];
            var flowIdStr = Request.Query["flowId"];
            var iterationIdStr = Request.Query["iterationId"];
            var unassignedStr = Request.Query["unassigned"];

            if (!string.IsNullOrEmpty(strideIdStr) && int.TryParse(strideIdStr, out int strideId))
            {
                moments = await _momentService.GetMomentsByStrideAsync(strideId);
            }
            else if (!string.IsNullOrEmpty(flowIdStr) && int.TryParse(flowIdStr, out int flowId))
            {
                moments = await _momentService.GetMomentsByFlowAsync(flowId);
            }
            else if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
            {
                bool unassignedOnly = unassignedStr == "true";
                moments = await _momentService.GetMomentsByIterationAsync(iterationId, unassignedOnly);
            }
            else
            {
                moments = await _momentService.GetAllAsync();
            }

            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _service));

            return Ok(result);
        }

        /// <summary>
        /// Assign a moment to a stride or move it to the backlog (strideId = null).
        /// Requires Edit permission on the project.
        /// </summary>
        [HttpPatch("{id}/stride-assignment")]
        public async Task<ActionResult<MomentDTO>> AssignMomentToStride(
            int id,
            [FromBody] UpdateMomentStrideAssignmentRequest request)
        {
            if (!await UserCanEditMomentAsync(id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.AssignMomentToStrideAsync(id, request.StrideId);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    id,
                    DateTime.UtcNow,
                    new { StrideId = request.StrideId });

                return Ok(_mapper.Map(moment, _service));
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

        /// <summary>
        /// Update the status of a moment.
        /// Requires Edit permission on the project.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentStatus(
            int id,
            [FromBody] UpdateMomentStatusRequest request)
        {
            if (!await UserCanEditMomentAsync(id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.UpdateMomentStatusAsync(id, request.NewStatus);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    id,
                    DateTime.UtcNow,
                    new { NewStatus = request.NewStatus.ToString() });

                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Updates the T‑shirt size estimate for a moment (partial update).
        /// Requires Edit permission on the project.
        /// </summary>
        [HttpPatch("{id}/estimate")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentEstimate(
            int id,
            [FromBody] UpdateMomentEstimateRequest request)
        {
            if (!await UserCanEditMomentAsync(id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.UpdateMomentEstimateAsync(id, request.Estimate);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    id,
                    DateTime.UtcNow,
                    new { Estimate = request.Estimate?.ToString() });

                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Updates the type of a moment.
        /// Requires Edit permission on the project.
        /// </summary>
        [HttpPatch("{id}/type")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentType(
            int id,
            [FromBody] UpdateMomentTypeRequest request)
        {
            if (!await UserCanEditMomentAsync(id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.GetByIdAsync(id);
                if (moment is null)
                    return NotFound($"Moment with ID {id} not found.");

                moment.Type = request.NewType;
                moment.UpdatedAt = DateTime.UtcNow;

                await _momentService.UpdateAsync(moment);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    id,
                    DateTime.UtcNow,
                    new { NewType = request.NewType.ToString() });

                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Assigns a specific user as the owner of the moment, or clears the owner when UserId is null.
        /// Requires Edit permission on the project.
        /// </summary>
        [HttpPatch("{id}/owner")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentOwner(
            int id,
            [FromBody] UpdateMomentOwnerRequest request)
        {
            if (!await UserCanEditMomentAsync(id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var moment = await _momentService.AssignOwnerAsync(id, request.UserId);

                var jwtSub = User.FindFirst("sub")?.Value
                          ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation(
                    "User {JwtSub} updated Moment {MomentId} at {UtcTimestamp}: {Changes}",
                    jwtSub,
                    id,
                    DateTime.UtcNow,
                    new { OwnerUserId = request.UserId });

                return Ok(_mapper.Map(moment, _service));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Returns all moments assigned to the currently authenticated user.
        /// </summary>
        [HttpGet("assigned-to-me")]
        public async Task<ActionResult<IEnumerable<MomentDTO>>> GetMyAssignedMoments()
        {
            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var moments = await _momentService.GetMomentsByOwnerIdAsync(user.Id);
            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _service));

            return Ok(result);
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }

        /// <summary>
        /// Returns true if the current user has Edit permission on the moment's project.
        /// </summary>
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