using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : GenericController<Project, ProjectDTO>
    {
        private readonly IProjectService _projectService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly IGenericService<Promise> _promiseService;
        private readonly IGenericMapper<Promise, PromiseDTO> _promiseMapper;

        public ProjectsController(
            IProjectService projectService,
            IGenericMapper<Project, ProjectDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService,
            IGenericService<Promise> promiseService,
            IGenericMapper<Promise, PromiseDTO> promiseMapper)
            : base(projectService, mapper)
        {
            _projectService = projectService;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _promiseService = promiseService;
            _promiseMapper = promiseMapper;
        }

        // ✅ READ scope
        [Authorize(Policy = "Projects.Read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<ProjectDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var projects = await _projectService.GetAccessibleProjectsAsync(user.Id);

            var result = new List<ProjectDTO>();
            foreach (var project in projects)
                result.Add(_mapper.Map(project, _service));

            return Ok(result);
        }

        // ✅ READ scope
        [Authorize(Policy = "Projects.Read")]
        [HttpGet("{id}/members")]
        public async Task<ActionResult<IEnumerable<ProjectMemberDTO>>> GetMembers(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var members = await _projectService.GetProjectMembersAsync(id);
            return Ok(members);
        }

        // ✅ READ scope
        [Authorize(Policy = "Projects.Read")]
        [HttpGet("{id}/promises")]
        public async Task<ActionResult<IEnumerable<PromiseDTO>>> GetProjectPromises(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var promises = await _projectService.GetProductPromisesAsync(id);
            var result = promises
                .OrderBy(p => p.DisplayOrder)
                .Select(p => _promiseMapper.Map(p, _promiseService))
                .ToList();

            return Ok(result);
        }

        // ✅ READ scope (FIXED)
        [Authorize(Policy = "Projects.Read")]
        [HttpGet("{projectId}/my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(int projectId)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email)) return Unauthorized();

            var user = await _userRepository.GetOrCreateUserByEmailAsync(email);

            var permission = await _permissionService.GetUserPermissionAsync(user.Id, projectId);

            if (permission == null)
                return NoContent();

            return Ok(permission.ToString());
        }

        // ✅ WRITE scope
        [Authorize(Policy = "Projects.Write")]
        [HttpPost("create")]
        public async Task<ActionResult<ProjectDTO>> CreateFromDto([FromBody] ProjectCreateDTO dto)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Project name is missing");

            var project = new Project
            {
                Name = dto.Name,
                Description = dto.Description,
                OwnerId = user.Id
            };

            await _service.AddAsync(project);

            return CreatedAtAction(nameof(GetById),
                new { id = project.Id },
                _mapper.Map(project, _service));
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