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
    public class EpicsController : GenericController<Epic, EpicDTO>
    {
        private readonly IEpicService _epicService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;

        public EpicsController(
            IEpicService service,
            IGenericMapper<Epic, EpicDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService)
            : base(service, mapper)
        {
            _epicService = service;
            _userRepository = userRepository;
            _permissionService = permissionService;
        }

        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<EpicDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var promiseIdStr = Request.Query["promiseId"];

            if (string.IsNullOrEmpty(promiseIdStr) ||
                !int.TryParse(promiseIdStr, out int promiseId))
            {
                return BadRequest("promiseId is required.");
            }

            // ✅ Resolve projectId
            var projectId = await _epicService.GetProjectIdFromPromiseAsync(promiseId);

            // ✅ Permission check
            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var epics = await _epicService.GetEpicsByPromiseAsync(promiseId);

            var result = new List<EpicDTO>();
            foreach (var epic in epics)
                result.Add(_mapper.Map(epic, _service));

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