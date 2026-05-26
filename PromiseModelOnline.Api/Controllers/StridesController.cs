using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class StridesController : GenericController<Stride, StrideDTO>
    {
        private readonly IStrideService _strideService;
        private readonly IMomentService _momentService;
        private readonly ILogger<StridesController> _logger;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;

        public StridesController(
            IStrideService strideService,
            IGenericMapper<Stride, StrideDTO> mapper,
            IMomentService momentService,
            ILogger<StridesController> logger,
            IUserRepository userRepository,
            IPermissionService permissionService)
            : base(strideService, mapper)
        {
            _strideService = strideService;
            _momentService = momentService;
            _logger = logger;
            _userRepository = userRepository;
            _permissionService = permissionService;
        }

        // ✅ READ scope
        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<StrideDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var iterationIdStr = Request.Query["iterationId"];

            if (string.IsNullOrEmpty(iterationIdStr) ||
                !int.TryParse(iterationIdStr, out int iterationId))
                return BadRequest("iterationId is required.");

            var projectId = await _strideService.GetProjectIdFromIterationAsync(iterationId);

            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var strides = await _strideService.GetStridesByIterationAsync(iterationId);

            var result = new List<StrideDTO>();
            foreach (var stride in strides)
                result.Add(_mapper.Map(stride, _service));

            return Ok(result);
        }

        // ✅ WRITE scope
        [Authorize(Policy = "Projects.Write")]
        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateStride(int id, [FromBody] UpdateStrideRequestDTO request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var projectId = await _strideService.GetProjectIdAsync(id);

            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.Edit))
                return Forbid();

            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);

                _logger.LogInformation("Progressed stride {StrideId}", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update stride {StrideId}", id);

                return BadRequest("Invalid operation.");
            }
        }

        // ✅ WRITE scope
        [Authorize(Policy = "Projects.Write")]
        [HttpPost("{id}/progress")]
        public async Task<ActionResult> ProgressStride(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var projectId = await _strideService.GetProjectIdAsync(id);

            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.Edit))
                return Forbid();

            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);
                return NoContent();
            }
            catch (Exception)
            {
                return BadRequest("Invalid operation.");
            }
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;

            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }
    }
}