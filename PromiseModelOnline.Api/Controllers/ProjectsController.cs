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
namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for user project listing, creation, and import.</summary>
/// <remarks>
///   Requires <c>projects.read</c> for listing and <c>projects.write</c> for creation/import.
///   Lists projects accessible to the current user (owned or shared).
/// </remarks>
/// <remarks>Initializes the controller with required services and repositories.</remarks>
/// <param name="projectService">The project service.</param>
/// <param name="userRepository">The user repository.</param>
/// <param name="mapper">The mapper.</param>
/// <param name="service">The generic service.</param>
/// <param name="projectImportService">The project import service.</param>
/// <param name="projectImportValidationService">The project import validation service.</param>
[Route("api/projects")]
#pragma warning disable S4502 // CSRF not applicable — API controllers use JWT Bearer token authentication (browsers never auto-attach Authorization header); compensating controls: CORS whitelist + projects.read/write authorization policies
[IgnoreAntiforgeryToken]
#pragma warning restore S4502
public class UserProjectsController(
    IProjectService projectService,
    IUserRepository userRepository,
    IGenericMapper<Project, ProjectDto> mapper,
    IGenericService<Project> service,
    IProjectImportService projectImportService,
    IProjectImportValidationService projectImportValidationService) : ControllerBase
{
    private readonly IProjectService _projectService = projectService;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IGenericMapper<Project, ProjectDto> _mapper = mapper;
    private readonly IGenericService<Project> _service = service;
    private readonly IProjectImportService _projectImportService = projectImportService;
    private readonly IProjectImportValidationService _projectImportValidationService = projectImportValidationService;

    /// <summary>Return all projects accessible to the current user.</summary>
    /// <returns>A list of project DTOs accessible to the user.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetAll()
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
    [HttpPost("create")]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] ProjectCreateDto request)
    {
        if (request is null) return BadRequest("Request body is required.");
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (string.IsNullOrWhiteSpace(request.Name))
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
    /// <param name="file">The uploaded JSON export file.</param>
    /// <returns>The validation result.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost("import/validate")]
    public async Task<ActionResult<ProjectImportValidationResult>> ValidateImport([FromForm] IFormFile file)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        using var stream = new System.IO.MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;

        var result = await _projectImportValidationService.ValidateAsync(stream);
        if (result.IsValid) return Ok(result);
        return BadRequest(result);
    }

    /// <summary>Import a project from a validated export document.</summary>
    /// <param name="file">The uploaded JSON export file.</param>
    /// <returns>The import result.</returns>
    [Authorize(Policy = "projects.write")]
    [HttpPost("import")]
    public async Task<ActionResult<ProjectImportResult>> Import([FromForm] IFormFile file)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();

        using var stream = new System.IO.MemoryStream();
        await file.CopyToAsync(stream);
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
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
    }
}
