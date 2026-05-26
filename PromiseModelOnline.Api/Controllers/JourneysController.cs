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
    public class JourneysController : GenericController<Journey, JourneyDTO>
    {
        private readonly IJourneyService _journeyService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;

        public JourneysController(
            IJourneyService service,
            IGenericMapper<Journey, JourneyDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService)
            : base(service, mapper)
        {
            _journeyService = service;
            _userRepository = userRepository;
            _permissionService = permissionService;
        }

        // ✅ READ scope
        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<JourneyDTO>>> GetAll()
        {
            // ✅ Get user
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            // ✅ Resolve projectId
            var epicIdStr = Request.Query["epicId"];

            if (string.IsNullOrEmpty(epicIdStr) ||
                !int.TryParse(epicIdStr, out int epicId))
            {
                return BadRequest("epicId is required.");
            }
            var projectId = await _journeyService.GetProjectIdFromEpicAsync(epicId);

            // ✅ Permission check (VIEW)
            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var journeys = await _journeyService.GetJourneysByEpicAsync(epicId);

            var result = new List<JourneyDTO>();
            foreach (var j in journeys)
                result.Add(_mapper.Map(j, _service));

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