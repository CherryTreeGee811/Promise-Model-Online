using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class StrideService : GenericService<Stride>, IStrideService
    {
        private readonly IStrideRepository _strideRepository;
        private readonly IGenericRepository<Iteration> _iterationRepository;
        private readonly IProjectService _projectService;
        private readonly INotificationService _notificationService;

        public StrideService(
            IStrideRepository strideRepository,
            IGenericRepository<Iteration> iterationRepository,
            IProjectService projectService,
            INotificationService notificationService)
            : base(strideRepository)
        {
            _strideRepository = strideRepository;
            _iterationRepository = iterationRepository;
            _projectService = projectService;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId)
            => await _strideRepository.GetStridesByIterationAsync(iterationId);

        // ✅ Resolve projectId from iteration
        public async Task<int> GetProjectIdFromIterationAsync(int iterationId)
        {
            var iteration = await _iterationRepository.GetByIdAsync(iterationId);

            if (iteration == null)
                throw new KeyNotFoundException("Iteration not found");

            return iteration.ProjectId;
        }

        // ✅ Resolve projectId from stride
        public async Task<int> GetProjectIdAsync(int strideId)
        {
            var stride = await _strideRepository.GetByIdAsync(strideId);

            if (stride == null)
                throw new KeyNotFoundException("Stride not found");

            if (stride.IterationId == null)
                throw new InvalidOperationException("Stride has no iteration");

            var iteration = await _iterationRepository.GetByIdAsync(stride.IterationId.Value);

            if (iteration == null)
                throw new KeyNotFoundException("Iteration not found");

            return iteration.ProjectId;
        }

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