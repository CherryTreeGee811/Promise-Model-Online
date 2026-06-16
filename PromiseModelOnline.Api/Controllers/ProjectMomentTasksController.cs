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

    /// <summary>REST controller for moment sub-task CRUD within a project scope.</summary>
    [Route("api/projects/{owner}/{project}/moments/{momentSeq}/tasks")]
    public class ProjectMomentTasksController : ProjectScopedControllerBase
    {
        private readonly IMomentService _momentService;

        private readonly IMomentTaskService _momentTaskService;

        private readonly IUserRepository _userRepository;

        private readonly IPermissionService _permissionService;

        private readonly ILogger<ProjectMomentTasksController> _logger;

        private readonly IPromiseModelOnlineContext _context;



        /// <param name="context">The database context for data access.</param>
        /// <param name="logger">The logger for audit and error events.</param>
        /// <param name="momentService">The service for moment operations.</param>
        /// <param name="momentTaskService">The service for moment task operations.</param>
        /// <param name="permissionService">The service for permission validation.</param>
        /// <param name="projectService">The service for project operations.</param>
        /// <param name="userRepository">The repository for user data access.</param>
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



        /// <summary>Create a sub-task for a moment within the project scope.</summary>
        /// <param name="momentSeq">The moment's sequence number.</param>
        /// <param name="request">The task creation data.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The created task DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<MomentTaskDto>> Create(int momentSeq, [FromBody] CreateMomentTaskRequestDto request, string owner, string project)
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



        /// <summary>Toggle completion state of a moment sub-task.</summary>
        /// <param name="momentSeq">The moment's sequence number.</param>
        /// <param name="taskId">The task ID to update.</param>
        /// <param name="request">The completion update data.</param>
        /// <param name="owner">The project owner's URL-safe slug.</param>
        /// <param name="project">The project's URL-safe slug.</param>
        /// <returns>The updated task DTO.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{taskId:int}/completion")]
        public async Task<ActionResult<MomentTaskDto>> UpdateCompletion(int momentSeq, int taskId, [FromBody] UpdateMomentTaskCompletionRequestDto request, string owner, string project)
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



        /// <summary>Map a MomentTask entity to its DTO.</summary>

        /// <param name="task">The task entity.</param>
        /// <returns>The mapped task DTO.</returns>

        private static MomentTaskDto Map(MomentTask task)

        {

            return new MomentTaskDto

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
