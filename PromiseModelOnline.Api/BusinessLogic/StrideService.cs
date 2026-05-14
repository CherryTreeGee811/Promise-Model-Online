using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class StrideService : GenericService<Stride>, IStrideService
    {
        private readonly IStrideRepository _strideRepository;
        private readonly IGenericRepository<Iteration> _iterationRepository;
        private readonly IProjectService _projectService;
        private readonly INotificationService _notificationService;

        public StrideService(IStrideRepository strideRepository, IGenericRepository<Iteration> iterationRepository,
            IProjectService projectService, INotificationService notificationService)
            : base(strideRepository)
        {
            _strideRepository = strideRepository;
            _iterationRepository = iterationRepository;
            _projectService = projectService;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId)
            => await _strideRepository.GetStridesByIterationAsync(iterationId);

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