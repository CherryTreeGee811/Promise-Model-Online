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
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class ProjectsController : GenericController<Project, ProjectDTO>
    {
        private readonly IProjectService _projectService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly IGenericService<Promise> _promiseService;
        private readonly IGenericMapper<Promise, PromiseDTO> _promiseMapper;
        private readonly IProjectExportService _projectExportService;
        private readonly IProjectImportService _projectImportService;
        private readonly IProjectImportValidationService _projectImportValidationService;

        public ProjectsController(
            IProjectService projectService,
            IGenericMapper<Project, ProjectDTO> mapper,
            IUserRepository userRepository,
            IPermissionService permissionService,
            IGenericService<Promise> promiseService,
            IGenericMapper<Promise, PromiseDTO> promiseMapper,
            IProjectExportService projectExportService,
            IProjectImportService projectImportService,
            IProjectImportValidationService projectImportValidationService)
            : base(projectService, mapper)
        {
            _projectService = projectService;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _promiseService = promiseService;
            _promiseMapper = promiseMapper;
            _projectExportService = projectExportService;
            _projectImportService = projectImportService;
            _projectImportValidationService = projectImportValidationService;
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

        /// <summary>
        /// Returns the project owner plus all users who have any permission on this project.
        /// </summary>
        [HttpGet("{id}/members")]
        public async Task<ActionResult<IEnumerable<ProjectMemberDTO>>> GetMembers(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var members = await _projectService.GetProjectMembersAsync(id);
            return Ok(members);
        }

        [HttpGet("{id}/promises")]
        public async Task<ActionResult<IEnumerable<PromiseDTO>>> GetProjectPromises(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var promises = await _projectService.GetProductPromisesAsync(id);
            var result = promises
                .OrderBy(promise => promise.DisplayOrder)
                .Select(promise => _promiseMapper.Map(promise, _promiseService))
                .ToList();

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

        [HttpGet("{projectId}/my-permission")]
        public async Task<ActionResult<string>> GetMyPermission(int projectId)
        {
            try
            {
                var email = User.FindFirstValue(ClaimTypes.Email);
                if (string.IsNullOrEmpty(email))
                    return Unauthorized();

                var user = await _userRepository.GetOrCreateUserByEmailAsync(email);

                var permission = await _permissionService.GetUserPermissionAsync(user.Id, projectId);

                if (permission == null)
                    return NoContent();

                return Ok(permission.ToString());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Create endpoint that accepts a lightweight DTO so clients don't have to send Owner/OwnerId.
        [HttpPost("create")]
        public async Task<ActionResult<ProjectDTO>> CreateFromDto([FromBody] DTOs.ProjectCreateDTO dto)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Project name is missing");

            var project = new Project
            {
                Name = dto.Name,
                Description = dto.Description,
                OwnerId = user.Id
            };

            await _service.AddAsync(project);
            return CreatedAtAction(nameof(GetById), new { id = project.Id }, _mapper.Map(project, _service));
        }

        [HttpPatch("{id}/details")]
        public async Task<ActionResult<ProjectDTO>> UpdateDetails(int id, [FromBody] UpdateProjectDetailsRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Project title is required.");

            var project = await _service.GetByIdAsync(id);
            if (project is null)
                return NotFound();

            project.Name = request.Name.Trim();
            project.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();

            await _service.UpdateAsync(project);
            return Ok(_mapper.Map(project, _service));
        }

        [HttpGet("{id}/export")]
        public async Task<IActionResult> Export(int id)
        {
            var user = await GetCurrentUserAsync();
            if (user is null)
                return Unauthorized();

            var accessibleProjects = await _projectService.GetAccessibleProjectsAsync(user.Id);
            if (!accessibleProjects.Any(project => project.Id == id))
                return Forbid();

            try
            {
                var exportDocument = await _projectExportService.BuildExportAsync(id);
                var json = JsonSerializer.Serialize(exportDocument, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                return File(Encoding.UTF8.GetBytes(json), "application/json", $"project-{id}-export.json");
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

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
            return CreatedAtAction(nameof(GetById), new { id = result.ProjectId }, result);
        }

        // Diagnostic endpoint removed. Temporary debug method rolled back.
    }
}