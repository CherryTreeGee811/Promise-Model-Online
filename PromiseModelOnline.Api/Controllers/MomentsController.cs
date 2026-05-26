using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Hubs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MomentsController : GenericController<Moment, MomentDTO>
    {
        private readonly IMomentService _momentService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<MomentsController> _logger;
        private readonly IHubContext<NotificationHub> _hub;

        public MomentsController(
            IMomentService service,
            IGenericMapper<Moment, MomentDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService,
            ILogger<MomentsController> logger,
            IHubContext<NotificationHub> hub)
            : base(service, mapper)
        {
            _momentService = service;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _logger = logger;
            _hub = hub;
        }

        // =========================================
        // ✅ GET ALL (READ)
        // =========================================

        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<MomentDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            IEnumerable<Moment> moments;

            var strideIdStr = Request.Query["strideId"];
            var flowIdStr = Request.Query["flowId"];
            var iterationIdStr = Request.Query["iterationId"];
            var unassignedStr = Request.Query["unassigned"];

            int projectId;

            if (!string.IsNullOrEmpty(strideIdStr) && int.TryParse(strideIdStr, out int strideId))
            {
                projectId = await _momentService.GetProjectIdFromStrideAsync(strideId);

                if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                    return Forbid();

                moments = await _momentService.GetMomentsByStrideAsync(strideId);
            }
            else if (!string.IsNullOrEmpty(flowIdStr) && int.TryParse(flowIdStr, out int flowId))
            {
                projectId = await _momentService.GetProjectIdFromFlowAsync(flowId);

                if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                    return Forbid();

                moments = await _momentService.GetMomentsByFlowAsync(flowId);
            }
            else if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
            {
                projectId = await _momentService.GetProjectIdFromIterationAsync(iterationId);

                if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                    return Forbid();

                moments = await _momentService.GetMomentsByIterationAsync(iterationId, unassignedStr == "true");
            }
            else
            {
                return BadRequest("Must filter by strideId, flowId, or iterationId.");
            }

            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _service));

            return Ok(result);
        }

        // =========================================
        // ✅ WRITE: STATUS
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentStatus(int id, [FromBody] UpdateMomentStatusRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (request == null)
                return BadRequest("Request body is required.");

            if (!await UserCanEditMomentAsync(id, user))
                return Forbid();

            var moment = await _momentService.UpdateMomentStatusAsync(id, request.NewStatus);

            var dto = _mapper.Map(moment, _service);

            await BroadcastMomentUpdateSafe(id, moment);

            return Ok(dto);
        }

        // =========================================
        // ✅ WRITE: STRIDE
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpPatch("{id}/stride-assignment")]
        public async Task<ActionResult<MomentDTO>> AssignMomentToStride(int id, [FromBody] UpdateMomentStrideAssignmentRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (!await UserCanEditMomentAsync(id, user))
                return Forbid();

            var moment = await _momentService.AssignMomentToStrideAsync(id, request.StrideId);

            var dto = _mapper.Map(moment, _service);

            await BroadcastMomentUpdateSafe(id, moment);

            return Ok(dto);
        }

        // =========================================
        // ✅ WRITE: TYPE (RE-ADDED FOR TEST COMPATIBILITY)
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpPatch("{id}/type")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentType(int id, [FromBody] UpdateMomentTypeRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (!await UserCanEditMomentAsync(id, user))
                return Forbid();

            var moment = await _momentService.GetByIdAsync(id);
            if (moment == null)
                return NotFound();

            moment.Type = request.NewType;
            moment.UpdatedAt = DateTime.UtcNow;

            await _momentService.UpdateAsync(moment);

            var dto = _mapper.Map(moment, _service);

            await BroadcastMomentUpdateSafe(id, moment);

            return Ok(dto);
        }

        // =========================================
        // ✅ WRITE: OWNER
        // =========================================

        [Authorize(Policy = "Projects.Write")]
        [HttpPatch("{id}/owner")]
        public async Task<ActionResult<MomentDTO>> UpdateMomentOwner(int id, [FromBody] UpdateMomentOwnerRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (!await UserCanEditMomentAsync(id, user))
                return Forbid();

            var moment = await _momentService.AssignOwnerAsync(id, request.UserId);

            var dto = _mapper.Map(moment, _service);

            await BroadcastMomentUpdateSafe(id, moment);

            return Ok(dto);
        }

        // =========================================
        // ✅ READ: ASSIGNED TO ME
        // =========================================

        [Authorize(Policy = "Projects.Read")]
        [HttpGet("assigned-to-me")]
        public async Task<ActionResult<IEnumerable<MomentDTO>>> GetMyAssignedMoments()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var moments = await _momentService.GetMomentsByOwnerIdAsync(user.Id);

            var result = new List<MomentDTO>();
            foreach (var m in moments)
                result.Add(_mapper.Map(m, _service));

            return Ok(result);
        }

        // =========================================
        // ✅ SIGNALR BROADCAST (SAFE)
        // =========================================

        private async Task BroadcastMomentUpdateSafe(int momentId, Moment moment)
        {
            try
            {
                var projectId = await _momentService.GetProjectIdForMomentAsync(momentId);
                if (projectId == null) return;

                await _hub.Clients
                    .Group($"project-{projectId}")
                    .SendAsync("MomentUpdated", new
                    {
                        moment.Id,
                        moment.Type,
                        moment.Status,
                        moment.OwnerId
                    });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SignalR broadcast failed for Moment {MomentId}", momentId);
            }
        }

        // =========================================
        // ✅ AUTH HELPERS (OAUTH SAFE)
        // =========================================

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;

            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }

        private async Task<bool> UserCanEditMomentAsync(int momentId, User user)
        {
            var projectId = await _momentService.GetProjectIdForMomentAsync(momentId);
            if (projectId == null) return false;

            var level = await _permissionService.GetUserPermissionAsync(user.Id, projectId.Value);
            return level == PermissionLevel.Edit;
        }
    }
}