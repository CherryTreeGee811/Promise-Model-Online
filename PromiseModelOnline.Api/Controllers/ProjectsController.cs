using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects")]
    public class UserProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly IUserRepository _userRepository;
        private readonly IGenericMapper<Project, ProjectDTO> _mapper;
        private readonly IGenericService<Project> _service;
        private readonly IProjectImportService _projectImportService;
        private readonly IProjectImportValidationService _projectImportValidationService;

        public UserProjectsController(
            IProjectService projectService,
            IUserRepository userRepository,
            IGenericMapper<Project, ProjectDTO> mapper,
            IGenericService<Project> service,
            IProjectImportService projectImportService,
            IProjectImportValidationService projectImportValidationService)
        {
            _projectService = projectService;
            _userRepository = userRepository;
            _mapper = mapper;
            _service = service;
            _projectImportService = projectImportService;
            _projectImportValidationService = projectImportValidationService;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetAll()
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

        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<ProjectDTO>> CreateFromDto([FromBody] ProjectCreateDTO dto)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Project name is missing");

            var slug = await _projectService.GenerateProjectSlugAsync(dto.Name, user.Id);

            var project = new Project
            {
                Name = dto.Name,
                Slug = slug,
                Description = dto.Description,
                OwnerId = user.Id
            };

            await _service.AddAsync(project);
            var loaded = await _projectService.GetByOwnerAndSlugAsync(user.Slug, slug);

            var dtoResult = _mapper.Map(loaded ?? project, _service);
            return CreatedAtAction(nameof(GetAll), null, dtoResult);
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost("import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Import([FromForm] IFormFile file)
        {
            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            if (file is null || file.Length == 0)
                return BadRequest("Import file is missing.");

            await using var stream = file.OpenReadStream();
            var validation = await _projectImportValidationService.ValidateAsync(stream);
            if (!validation.IsValid)
            {
                return BadRequest(new
                {
                    errors = validation.Errors,
                    warnings = validation.Warnings
                });
            }

            var result = await _projectImportService.ImportAsync(validation.Document!, user.Id);
            return CreatedAtAction(nameof(GetAll), result);
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
