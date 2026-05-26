using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FlowsController : GenericController<Flow, FlowDTO>
    {
        private readonly IFlowService _flowService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;

        public FlowsController(
            IFlowService flowService,
            IGenericMapper<Flow, FlowDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService)
            : base(flowService, mapper)
        {
            _flowService = flowService;
            _userRepository = userRepository;
            _permissionService = permissionService;
        }

        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<FlowDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var journeyIdStr = Request.Query["journeyId"];

            if (string.IsNullOrEmpty(journeyIdStr) ||
                !int.TryParse(journeyIdStr, out int journeyId))
                return BadRequest("journeyId is required");

            var projectId = await _flowService.GetProjectIdFromJourneyAsync(journeyId);

            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var flows = await _flowService.GetFlowsByJourneyAsync(journeyId);

            var result = new List<FlowDTO>();
            foreach (var f in flows)
                result.Add(_mapper.Map(f, _service));

            return Ok(result);
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
