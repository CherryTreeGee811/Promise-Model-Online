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
    public class ProjectsController : GenericController<Project, ProjectDTO>
    {
        private readonly IProjectService _projectService;
        private readonly IUserRepository _userRepository;

        public ProjectsController(
            IProjectService projectService,
            IGenericMapper<Project, ProjectDTO> mapper,
            IUserRepository userRepository)
            : base(projectService, mapper)
        {
            _projectService = projectService;
            _userRepository = userRepository;
        }

        [HttpGet]
        public override async Task<ActionResult<IEnumerable<ProjectDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var projects = await _projectService.GetAccessibleProjectsAsync(user.Id);

            var result = new List<ProjectDTO>();
            foreach (var project in projects)
                result.Add(_mapper.Map(project, _service));

            return Ok(result);
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            return await _userRepository.GetOrCreateUserByEmailAsync(email);
        }
    }
}