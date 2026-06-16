using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PMO.Core.Models;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for moment sub-task CRUD within a parent moment.</summary>
    /// <remarks>
    ///   Requires <c>projects.write</c> policy. All operations verify the current user has
    ///   <see cref="PermissionLevel.Edit"/> on the moment's project. Routes are scoped under
    ///   <c>/api/moments/{momentId}/tasks</c>.
    /// </remarks>
    [Route("api/moments/{momentId:int}/tasks")]
    public class MomentTasksController : ControllerBase
    {
        private readonly IMomentService _momentService;
        private readonly IMomentTaskService _momentTaskService;
        private readonly IUserRepository _userRepository;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<MomentTasksController> _logger;

        /// <param name="logger">The logger for audit and error events.</param>
        /// <param name="momentService">The service for moment operations.</param>
        /// <param name="momentTaskService">The service for moment task operations.</param>
        /// <param name="permissionService">The service for permission validation.</param>
        /// <param name="userRepository">The repository for user data access.</param>
        public MomentTasksController(
            IMomentService momentService,
            IMomentTaskService momentTaskService,
            IUserRepository userRepository,
            IPermissionService permissionService,
            ILogger<MomentTasksController> logger)
        {
            _momentService = momentService;
            _momentTaskService = momentTaskService;
            _userRepository = userRepository;
            _permissionService = permissionService;
            _logger = logger;
        }

        /// <summary>Create a sub-task for a moment.</summary>
        /// <param name="momentId">The parent moment ID.</param>
        /// <param name="request">The task creation data.</param>
        /// <returns>The created task DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<MomentTaskDTO>> Create(int momentId, [FromBody] CreateMomentTaskRequestDTO request)
        {
            if (!await UserCanEditMomentAsync(momentId))
                return Forbid();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var moment = await _momentService.GetByIdAsync(momentId);
            if (moment is null)
                return NotFound($"Moment with ID {momentId} not found.");

            var task = new MomentTask
            {
                MomentId = momentId,
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
                momentId,
                DateTime.UtcNow);

            return Ok(Map(task));
        }

        /// <summary>Toggle completion state of a moment sub-task.</summary>
        /// <param name="momentId">The parent moment ID.</param>
        /// <param name="taskId">The task ID to update.</param>
        /// <param name="request">The completion update data.</param>
        /// <returns>The updated task DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{taskId:int}/completion")]
        public async Task<ActionResult<MomentTaskDTO>> UpdateCompletion(int momentId, int taskId, [FromBody] UpdateMomentTaskCompletionRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var task = await _momentTaskService.GetByIdAsync(taskId);
            if (task is null || task.MomentId != momentId)
                return NotFound($"Moment task with ID {taskId} not found.");

            if (!await UserCanEditMomentAsync(momentId))
                return Forbid();

            task.IsCompleted = request.IsCompleted;
            task.CompletedAt = request.IsCompleted ? DateTime.UtcNow : null;
            await _momentTaskService.UpdateAsync(task);

            _logger.LogInformation(
                "Updated MomentTask {MomentTaskId} completion for Moment {MomentId} at {UtcTimestamp}: {Changes}",
                taskId,
                momentId,
                DateTime.UtcNow,
                new { request.IsCompleted });

            return Ok(Map(task));
        }

        /// <summary>Map a MomentTask entity to its DTO.</summary>
        /// <param name="task">The task entity to map.</param>
        /// <returns>The mapped DTO.</returns>
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

        /// <summary>Resolve the current user from JWT claims.</summary>
        private async Task<User?> GetCurrentUserAsync()
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            return await _userRepository.GetOrCreateUserByEmailAsync(email, username);
        }

        /// <summary>Check if the current user has Edit permission.</summary>
        /// <param name="momentId">The moment ID.</param>
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
