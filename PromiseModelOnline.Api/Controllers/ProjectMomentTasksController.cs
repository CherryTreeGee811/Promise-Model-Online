using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects/{owner}/{project}/moments/{momentSeq}/tasks")]
    public class ProjectMomentTasksController : ProjectScopedControllerBase
    {
        private readonly IMomentService _momentService;
        private readonly IMomentTaskService _momentTaskService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<ProjectMomentTasksController> _logger;
        private readonly IPromiseModelOnlineContext _context;

        public ProjectMomentTasksController(
            IMomentService momentService,
            IMomentTaskService momentTaskService,
            IUserRepository userRepository,
            IPermissionService permissionService,
            ILogger<ProjectMomentTasksController> logger,
            IPromiseModelOnlineContext context,
            IProjectService projectService)
            : base(projectService)
        {
            _momentService = momentService;
            _momentTaskService = momentTaskService;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _logger = logger;
            _context = context;
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<MomentTaskDTO>> Create(int momentSeq, [FromBody] CreateMomentTaskRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == momentSeq);

            if (moment is null)
                return NotFound($"Moment with sequence {momentSeq} not found.");

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var task = new MomentTask
            {
                MomentId = moment.Id,
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? string.Empty : request.Description.Trim(),
                IsCompleted = request.IsCompleted,
                CreatedAt = DateTime.UtcNow,
                CompletedAt = request.IsCompleted ? DateTime.UtcNow : null,
            };

            await _momentTaskService.CreateAsync(task);

            _logger.LogInformation(
                "Created MomentTask {MomentTaskId} for Moment {MomentId} at {UtcTimestamp}",
                task.Id,
                moment.Id,
                DateTime.UtcNow);

            return Ok(Map(task));
        }

        [Authorize(Policy = "projects.write")]
        [HttpPatch("{taskId:int}/completion")]
        public async Task<ActionResult<MomentTaskDTO>> UpdateCompletion(int momentSeq, int taskId, [FromBody] UpdateMomentTaskCompletionRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var moment = await _context.Moments
                .FirstOrDefaultAsync(m => m.Flow.Journey.Epic.ProductPromise.ProjectId == projectEntity.Id && m.SequenceNumber == momentSeq);

            if (moment is null)
                return NotFound($"Moment with sequence {momentSeq} not found.");

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var task = await _momentTaskService.GetByIdAsync(taskId);
            if (task is null || task.MomentId != moment.Id)
                return NotFound($"Moment task with ID {taskId} not found.");

            if (!await UserCanEditMomentAsync(moment.Id))
                return Forbid();

            task.IsCompleted = request.IsCompleted;
            task.CompletedAt = request.IsCompleted ? DateTime.UtcNow : null;
            await _momentTaskService.UpdateAsync(task);

            _logger.LogInformation(
                "Updated MomentTask {MomentTaskId} completion for Moment {MomentId} at {UtcTimestamp}: {Changes}",
                taskId,
                moment.Id,
                DateTime.UtcNow,
                new { request.IsCompleted });

            return Ok(Map(task));
        }

        private static MomentTaskDTO Map(MomentTask task)
        {
            return new MomentTaskDTO
            {
                Id = task.Id,
                Name = task.Name,
                Description = task.Description,
                MomentId = task.MomentId,
                OwnerId = task.OwnerId,
                IsCompleted = task.IsCompleted,
                CreatedAt = task.CreatedAt,
                CompletedAt = task.CompletedAt,
            };
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }

        private async Task<bool> UserCanEditMomentAsync(int momentId)
        {
            var user = await GetCurrentUserAsync();
            if (user is null) return false;

            var projectId = await _momentService.GetProjectIdForMomentAsync(momentId);
            if (projectId is null) return false;

            var level = await _permissionService.GetUserPermissionAsync(user.Id, projectId.Value);
            return level == PermissionLevel.Edit;
        }
    }
}
