using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class IterationsController : GenericController<Iteration, IterationDTO>
    {
        private readonly IIterationService _iterationService;
        private readonly IMomentService _momentService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;

        public IterationsController(
            IIterationService service,
            IGenericMapper<Iteration, IterationDTO> mapper,
            IMomentService momentService,
            IUserRepository userRepository,
            IPermissionService permissionService)
            : base(service, mapper)
        {
            _iterationService = service;
            _momentService = momentService;
            _userRepository = userRepository;
            _permissionService = permissionService;
        }

        // ✅ READ scope    
        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<IterationDTO>>> GetAll()
        {
            var projectIdStr = Request.Query["projectId"];

            if (string.IsNullOrEmpty(projectIdStr) ||
                !int.TryParse(projectIdStr, out int projectId))
            {
                return BadRequest("projectId is required.");
            }

            // ✅ Get user
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var username = User.FindFirst("nameid")?.Value;
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);

            // ✅ Permission check
            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var iterations = await _iterationService.GetIterationsByProjectAsync(projectId);

            var result = new List<IterationDTO>();
            foreach (var iter in iterations)
                result.Add(_mapper.Map(iter, _service));

            return Ok(result);
        }


        // ✅ READ scope
        [Authorize(Policy = "Projects.Read")]
        [HttpGet("{id}/burndown")]
        public async Task<ActionResult<List<BurndownPointDTO>>> GetIterationBurndown(int id)
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            var username = User.FindFirst("nameid")?.Value;
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);

            // ✅ You'll need this method in service
            var projectId = await _iterationService.GetProjectIdAsync(id);

            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var points = await _momentService.GetIterationBurndownAsync(id);
            return Ok(points);
        }
    }
}