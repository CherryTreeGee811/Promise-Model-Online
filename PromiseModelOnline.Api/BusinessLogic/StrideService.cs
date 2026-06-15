using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Business logic for <see cref="Stride"/> entities with deadline notification automation.</summary>
    /// <remarks>
    ///   Provides iteration-scoped queries and a scheduled job method that sends deadline
    ///   reminders to all project members three days before a stride ends. Scoped lifetime.
    /// </remarks>
    public class StrideService : GenericService<Stride>, IStrideService
    {
        private readonly IStrideRepository _strideRepository;
        private readonly IGenericRepository<Iteration> _iterationRepository;
        private readonly IProjectService _projectService;
        private readonly INotificationService _notificationService;

        /// <summary>Initializes the service with required repositories and services.</summary>
        /// <param name="strideRepository">Repository for stride data access.</param>
        /// <param name="iterationRepository">Repository for iteration data access.</param>
        /// <param name="projectService">Service for project operations.</param>
        /// <param name="notificationService">Service for notification dispatch.</param>
        public StrideService(IStrideRepository strideRepository, IGenericRepository<Iteration> iterationRepository,
            IProjectService projectService, INotificationService notificationService)
            : base(strideRepository)
        {
            _strideRepository = strideRepository;
            _iterationRepository = iterationRepository;
            _projectService = projectService;
            _notificationService = notificationService;
        }

        /// <summary>Return all strides assigned to an iteration.</summary>
        /// <param name="iterationId">The iteration ID.</param>
        /// <returns>All strides in the given iteration.</returns>
        public async Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId)
            => await _strideRepository.GetStridesByIterationAsync(iterationId);

        /// <summary>Send deadline notifications for strides ending in 3 days.</summary>
        /// <remarks>
        ///   Called by a scheduled job (Hangfire / background service). Finds all strides whose
        ///   end date is in 3 days and sends <see cref="NotificationType.StrideEnding"/> alerts
        ///   to every member of the stride's project.
        /// </remarks>
        public async Task SendDeadlineNotificationsAsync()
        {
            var threeDaysFromNow = DateTime.UtcNow.Date.AddDays(3);
            var strides = await _strideRepository.GetStridesEndingOnAsync(threeDaysFromNow);
            foreach (var stride in strides)
            {
                if (stride.IterationId is null) continue;
                var iteration = await _iterationRepository.GetByIdAsync(stride.IterationId.Value);
                if (iteration is null) continue;
                var members = await _projectService.GetProjectMembersAsync(iteration.ProjectId);
                foreach (var member in members)
                {
                    await _notificationService.CreateNotificationAsync(
                        member.UserId,
                        NotificationType.StrideEnding,
                        $"Stride '{stride.Name}' ends in 3 days.",
                        $"/projects/{iteration.ProjectId}/strides"
                    );
                }
            }
        }
    }
}