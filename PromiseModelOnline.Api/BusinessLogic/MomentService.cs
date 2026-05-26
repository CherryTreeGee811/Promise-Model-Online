using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class MomentService : GenericService<Moment>, IMomentService
    {
        private readonly IMomentRepository _momentRepository;
        private readonly IGenericRepository<Stride> _strideRepository;
        private readonly IGenericRepository<Iteration> _iterationRepository;
        private readonly IGenericRepository<Flow> _flowRepository;
        private readonly IIterationService _iterationService;
        private readonly IStrideService _strideService;
        private readonly IHierarchyStatusService _hierarchyStatusService;
        private readonly IGenericRepository<Journey> _journeyRepository;
        private readonly IGenericRepository<Epic> _epicRepository;
        private readonly IGenericRepository<Promise> _promiseRepository;
        

        public MomentService(
            IMomentRepository momentRepository,
            IGenericRepository<Stride> strideRepository,
            IGenericRepository<Iteration> iterationRepository,
            IGenericRepository<Flow> flowRepository,
            IGenericRepository<Journey> journeyRepository,
            IGenericRepository<Epic> epicRepository,
            IGenericRepository<Promise> promiseRepository,
            IIterationService iterationService,
            IStrideService strideService,
            IHierarchyStatusService hierarchyStatusService)
            : base(momentRepository)
        {
            _momentRepository = momentRepository;
            _strideRepository = strideRepository;
            _iterationRepository = iterationRepository;
            _flowRepository = flowRepository;
            _iterationService = iterationService;
            _strideService = strideService;
            _hierarchyStatusService = hierarchyStatusService;
            _journeyRepository = journeyRepository;
            _epicRepository = epicRepository;
            _promiseRepository = promiseRepository;
        }

        // -------------------------------------------------------------------
        // Query methods
        // -------------------------------------------------------------------

        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
            => await _momentRepository.GetMomentsByFlowAsync(flowId);

        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
            => await _momentRepository.GetMomentsByStrideAsync(strideId);

        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
            => await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly);

        public async Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId)
            => await _momentRepository.GetMomentsByOwnerIdAsync(ownerId);

        // -------------------------------------------------------------------
        // Permission helpers (NEW)
        // -------------------------------------------------------------------

        public async Task<int> GetProjectIdFromFlowAsync(int flowId)
        {
            var flow = await _flowRepository.GetByIdAsync(flowId)
                    ?? throw new KeyNotFoundException("Flow not found");

            var journey = await _journeyRepository.GetByIdAsync(flow.JourneyId)
                        ?? throw new KeyNotFoundException("Journey not found");

            var epic = await _epicRepository.GetByIdAsync(journey.EpicId)
                    ?? throw new KeyNotFoundException("Epic not found");

            var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                        ?? throw new KeyNotFoundException("Promise not found");

            return promise.ProjectId;
        }

        public async Task<int> GetProjectIdFromStrideAsync(int strideId)
        {
            var stride = await _strideRepository.GetByIdAsync(strideId)
                         ?? throw new KeyNotFoundException("Stride not found");

            if (stride.IterationId == null)
                throw new InvalidOperationException("Stride has no iteration");

            var iteration = await _iterationRepository.GetByIdAsync(stride.IterationId.Value)
                           ?? throw new KeyNotFoundException("Iteration not found");

            return iteration.ProjectId;
        }

        public async Task<int> GetProjectIdFromIterationAsync(int iterationId)
        {
            var iteration = await _iterationRepository.GetByIdAsync(iterationId)
                           ?? throw new KeyNotFoundException("Iteration not found");

            return iteration.ProjectId;
        }

        // -------------------------------------------------------------------
        // Planning operations
        // -------------------------------------------------------------------

        public async Task<Moment> AssignMomentToStrideAsync(int momentId, int? strideId)
        {
            var moment = await _momentRepository.GetByIdAsync(momentId)
                         ?? throw new KeyNotFoundException($"Moment with ID {momentId} not found.");

            if (strideId is null)
            {
                moment.AssignedStrideId = null;
                moment.UpdatedAt = DateTime.UtcNow;
                _momentRepository.Update(moment);
                await _momentRepository.SaveChangesAsync();
                return moment;
            }

            var stride = await _strideRepository.GetByIdAsync(strideId.Value)
                         ?? throw new KeyNotFoundException($"Stride with ID {strideId} not found.");

            if (stride.IterationId is null)
                throw new InvalidOperationException($"Stride is not associated with an iteration.");

            moment.AssignedStrideId = stride.Id;
            moment.UpdatedAt = DateTime.UtcNow;

            _momentRepository.Update(moment);
            await _momentRepository.SaveChangesAsync();

            return moment;
        }

        public async Task<Moment> UpdateMomentStatusAsync(int momentId, MomentStatus newStatus)
        {
            var moment = await _momentRepository.GetByIdAsync(momentId)
                         ?? throw new KeyNotFoundException($"Moment with ID {momentId} not found.");

            moment.Status = newStatus;
            moment.StatusColor = StatusColorRules.FromMomentStatus(newStatus);
            moment.UpdatedAt = DateTime.UtcNow;

            if (newStatus == MomentStatus.Done)
                moment.CompletedAt = DateTime.UtcNow;
            else
                moment.CompletedAt = null;

            _momentRepository.Update(moment);
            await _momentRepository.SaveChangesAsync();

            await _hierarchyStatusService.RecalculateFromFlowAsync(moment.FlowId);

            return moment;
        }

        public async Task<Moment> UpdateMomentEstimateAsync(int momentId, Estimate? estimate)
        {
            var moment = await _momentRepository.GetByIdAsync(momentId)
                        ?? throw new KeyNotFoundException($"Moment with ID {momentId} not found.");

            moment.EffortEstimate = estimate;
            moment.UpdatedAt = DateTime.UtcNow;

            _momentRepository.Update(moment);
            await _momentRepository.SaveChangesAsync();

            return moment;
        }

        public async Task<int> GetTotalEffortForPromiseAsync(int promiseId)
        {
            var moments = await _momentRepository.GetMomentsByPromiseIdAsync(promiseId);
            return moments.Sum(m => EstimateToNumeric(m.EffortEstimate));
        }

        public async Task<Moment> AssignOwnerAsync(int momentId, int? userId)
        {
            var moment = await _momentRepository.GetByIdAsync(momentId)
                        ?? throw new KeyNotFoundException($"Moment with ID {momentId} not found.");

            moment.OwnerId = userId;
            moment.UpdatedAt = DateTime.UtcNow;

            _momentRepository.Update(moment);
            await _momentRepository.SaveChangesAsync();

            return moment;
        }

        public async Task<int?> GetProjectIdForMomentAsync(int momentId)
            => await _momentRepository.GetProjectIdForMomentAsync(momentId);

        // -------------------------------------------------------------------
        // Burndown logic (unchanged)
        // -------------------------------------------------------------------

        private static int EstimateToNumeric(Estimate? estimate)
        {
            return estimate switch
            {
                Estimate.XS => 1,
                Estimate.S => 2,
                Estimate.M => 3,
                Estimate.L => 5,
                Estimate.XL => 8,
                Estimate.XXL => 13,
                Estimate.XXXL => 21,
                _ => 0
            };
        }

        public async Task<List<BurndownPointDTO>> GetIterationBurndownAsync(int iterationId)
        {
            var assigned = await _momentRepository.GetMomentsByIterationAsync(iterationId, false);
            var unassigned = await _momentRepository.GetMomentsByIterationAsync(iterationId, true);

            var all = assigned.Concat(unassigned)
                              .GroupBy(m => m.Id)
                              .Select(g => g.First())
                              .ToList();

            return await ComputeBurndownAsync(all);
        }

        private async Task<List<BurndownPointDTO>> ComputeBurndownAsync(List<Moment> moments)
        {
            var result = new List<BurndownPointDTO>();
            if (!moments.Any()) return result;

            var start = moments.Min(m => m.CreatedAt).Date;
            var today = DateTime.UtcNow.Date;

            var completedDates = moments
                .Where(m => m.CompletedAt.HasValue)
                .Select(m => m.CompletedAt!.Value.Date)
                .ToList();

            var end = completedDates.Any() 
                ? completedDates.Max() > today ? completedDates.Max() : today 
                : today;

            var initial = moments.Sum(m => EstimateToNumeric(m.EffortEstimate));
            var totalDays = Math.Max((end - start).Days, 1);

            for (var date = start; date <= end; date = date.AddDays(1))
            {
                var remaining = moments
                    .Where(m => m.CompletedAt == null || m.CompletedAt.Value.Date > date)
                    .Sum(m => EstimateToNumeric(m.EffortEstimate));

                var dayNumber = (date - start).Days;
                var ideal = initial - (initial * dayNumber / totalDays);

                if (ideal < 0) ideal = 0;

                result.Add(new BurndownPointDTO
                {
                    Date = date,
                    RemainingEffort = remaining,
                    IdealRemaining = ideal
                });
            }

            return result;
        }

        public async Task MoveUnfinishedMomentsToNextStrideAsync(int strideId)
        {
            var moments = await _momentRepository.GetUnfinishedMomentsByStrideAsync(strideId);

            if (!moments.Any()) return;

            var currentStride = await _strideRepository.GetByIdAsync(strideId);
            if (currentStride == null || currentStride.IterationId == null) return;

            var strides = (await _strideService
                .GetStridesByIterationAsync(currentStride.IterationId.Value))
                .OrderBy(s => s.StartDate)
                .ToList();

            Stride? nextStride = null;

            for (int i = 0; i < strides.Count; i++)
            {
                if (strides[i].Id == strideId && i + 1 < strides.Count)
                {
                    nextStride = strides[i + 1];
                    break;
                }
            }

            if (nextStride == null)
                return;

            foreach (var moment in moments)
            {
                moment.AssignedStrideId = nextStride.Id;
                moment.UpdatedAt = DateTime.UtcNow;

                _momentRepository.Update(moment);
            }

            await _momentRepository.SaveChangesAsync();
        }
    }
}