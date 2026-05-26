using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PromisesController : GenericController<Promise, PromiseDTO>
    {
        private readonly IMomentService _momentService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly IPromiseService _promiseService;

        public PromisesController(
            IGenericService<Promise> service,
            IGenericMapper<Promise, PromiseDTO> mapper,
            IMomentService momentService,
            IUserRepository userRepository,
            IPermissionService permissionService,
            IPromiseService promiseService)
            : base(service, mapper)
        {
            _momentService = momentService;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _promiseService = promiseService;
        }

        [Authorize(Policy = "Projects.Read")]
        [HttpGet("{id}/total-effort")]
        public async Task<ActionResult<int>> GetTotalEffort(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var projectId = await _promiseService.GetProjectIdAsync(id);

            if (!await _permissionService.HasPermissionAsync(user.Id, projectId, PermissionLevel.View))
                return Forbid();

            var effort = await _momentService.GetTotalEffortForPromiseAsync(id);

            return Ok(effort);
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email)) 
                return null;

            var username = User.FindFirst("nameid")?.Value;

            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }
    }
}