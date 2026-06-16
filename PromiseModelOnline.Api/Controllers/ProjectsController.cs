using Microsoft.AspNetCore.Authorization;
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
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for user project listing, creation, and import.</summary>
    /// <remarks>
    ///   Requires <c>projects.read</c> for listing and <c>projects.write</c> for creation/import.
    ///   Lists projects accessible to the current user (owned or shared).
    /// </remarks>
    [Route("api/projects")]
    public class UserProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly IUserRepository _userRepository;
        private readonly IGenericMapper<Project, ProjectDTO> _mapper;
        private readonly IGenericService<Project> _service;
        private readonly IProjectImportService _projectImportService;
        private readonly IProjectImportValidationService _projectImportValidationService;
        private readonly ILogger<UserProjectsController> _logger;

        /// <summary>Initializes the controller with required services and repositories.</summary>
        /// <param name="projectService">The project service.</param>
        /// <param name="userRepository">The user repository.</param>
        /// <param name="mapper">The mapper.</param>
        /// <param name="service">The generic service.</param>
        /// <param name="projectImportService">The project import service.</param>
        /// <param name="projectImportValidationService">The project import validation service.</param>
        /// <param name="logger">The logger for audit and error events.</param>
        public UserProjectsController(
            IProjectService projectService,
            IUserRepository userRepository,
            IGenericMapper<Project, ProjectDTO> mapper,
            IGenericService<Project> service,
            IProjectImportService projectImportService,
            IProjectImportValidationService projectImportValidationService,
            ILogger<UserProjectsController> logger)
        {
            _projectService = projectService;
            _userRepository = userRepository;
            _mapper = mapper;
            _service = service;
            _projectImportService = projectImportService;
            _projectImportValidationService = projectImportValidationService;
            _logger = logger;
        }

        /// <summary>Return all projects accessible to the current user.</summary>
        /// <returns>A list of project DTOs accessible to the user.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectDTO>>> GetAll()
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var projects = await _projectService.GetAccessibleProjectsAsync(user.Id);
            return Ok(projects.Select(p => _mapper.Map(p, _service)).ToList());
        }
        /// <summary>Create a new project with auto-generated slug.</summary>
        /// <param name="request">The project creation data.</param>
        /// <returns>The created project DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<ProjectDTO>> Create([FromBody] ProjectCreateDTO request)
        {
            if (request is null || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Project name is required.");

            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            var slug = await _projectService.GenerateProjectSlugAsync(request.Name, user.Id);
            var project = new Project
            {
                Name = request.Name.Trim(),
                Slug = slug,
                Description = request.Description?.Trim(),
                OwnerId = user.Id,
                CreatedAt = DateTime.UtcNow
            };

            await _service.AddAsync(project);
            return CreatedAtAction(nameof(GetAll), new { id = project.Id }, _mapper.Map(project, _service));
        }

        /// <summary>Validate a project import JSON before committing.</summary>
        /// <returns>The validation result.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost("import/validate")]
        public async Task<ActionResult<ProjectImportValidationResult>> ValidateImport()
        {
            using var stream = new System.IO.MemoryStream();
            await Request.Body.CopyToAsync(stream);
            stream.Position = 0;

            var result = await _projectImportValidationService.ValidateAsync(stream);
            if (result.IsValid) return Ok(result);
            return BadRequest(result);
        }

        /// <summary>Import a project from a validated export document.</summary>
        /// <returns>The import result.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost("import")]
        public async Task<ActionResult<ProjectImportResult>> Import()
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return Unauthorized();

            using var stream = new System.IO.MemoryStream();
            await Request.Body.CopyToAsync(stream);
            stream.Position = 0;

            var validationResult = await _projectImportValidationService.ValidateAsync(stream);
            if (!validationResult.IsValid)
                return BadRequest(validationResult);

            var importResult = await _projectImportService.ImportAsync(validationResult.Document!, user.Id);
            return CreatedAtAction(nameof(GetAll), new { id = importResult.ProjectId }, importResult);
        }

        /// <summary>Resolve the current user from JWT claims.</summary>
        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;
            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }
    }
}
