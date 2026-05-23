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
        private readonly IIterationService _iterationService;
        private readonly IStrideService _strideService;
        private readonly IHierarchyStatusService _hierarchyStatusService;

        public MomentService(
            IMomentRepository momentRepository,
            IGenericRepository<Stride> strideRepository,
            IGenericRepository<Iteration> iterationRepository,
            IIterationService iterationService,
            IStrideService strideService,
            IHierarchyStatusService hierarchyStatusService)
            : base(momentRepository)
        {
            _momentRepository = momentRepository;
            _strideRepository = strideRepository;
            _iterationRepository = iterationRepository;
            _iterationService = iterationService;
            _strideService = strideService;
            _hierarchyStatusService = hierarchyStatusService;
        }

        // -------------------------------------------------------------------
        //  Query methods
        // -------------------------------------------------------------------
        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
            => await _momentRepository.GetMomentsByFlowAsync(flowId);

        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
            => await _momentRepository.GetMomentsByStrideAsync(strideId);

        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
            => await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly);

        public async Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId)
            => await _momentRepository.GetMomentsByOwnerIdAsync(ownerId);

        public override async Task AddAsync(Moment entity)
        {
            await base.AddAsync(entity);
            await _hierarchyStatusService.RecalculateFromFlowAsync(entity.FlowId);
        }

        public override async Task<bool> DeleteByIdAsync(object id)
        {
            var moment = await _momentRepository.GetByIdAsync(id);
            if (moment is null)
            {
                return false;
            }

            var deleted = await base.DeleteByIdAsync(id);
            if (deleted)
            {
                await _hierarchyStatusService.RecalculateFromFlowAsync(moment.FlowId);
            }

            return deleted;
        }

        // -------------------------------------------------------------------
        //  Planning operations
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
                throw new InvalidOperationException($"Stride with ID {stride.Id} is not associated with an iteration.");

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

        public async Task MoveUnfinishedMomentsToNextStrideAsync(int strideId)
        {
            var moments = await _momentRepository.GetUnfinishedMomentsByStrideAsync(strideId);
            if (!moments.Any()) return;

            var currentStride = await _strideRepository.GetByIdAsync(strideId);
            if (currentStride is null || currentStride.IterationId is null) return;

            var iterationStrides = (await _strideService.GetStridesByIterationAsync(currentStride.IterationId.Value))
                                    .OrderBy(s => s.StartDate).ToList();

            Stride? nextStride = null;
            for (int i = 0; i < iterationStrides.Count; i++)
            {
                if (iterationStrides[i].Id == strideId && i + 1 < iterationStrides.Count)
                {
                    nextStride = iterationStrides[i + 1];
                    break;
                }
            }

            if (nextStride is null)
            {
                var currentIteration = await _iterationRepository.GetByIdAsync(currentStride.IterationId.Value);
                if (currentIteration is not null)
                {
                    var nextIterations = (await _iterationService.GetIterationsByProjectAsync(currentIteration.ProjectId))
                                        .OrderBy(i => i.Id)
                                        .SkipWhile(i => i.Id <= currentIteration.Id)
                                        .ToList();
                    if (nextIterations.Any())
                    {
                        var firstStrideOfNextIteration = (await _strideService.GetStridesByIterationAsync(nextIterations.First().Id))
                                                        .OrderBy(s => s.StartDate).FirstOrDefault();
                        nextStride = firstStrideOfNextIteration;
                    }
                }
            }

            foreach (var moment in moments)
            {
                moment.AssignedStrideId = nextStride?.Id;
                moment.IsZombie = true;
                moment.OriginalStrideId = strideId;
                moment.UpdatedAt = DateTime.UtcNow;
                _momentRepository.Update(moment);
            }
            await _momentRepository.SaveChangesAsync();
        }

        // ---------------------------------------------------------------
        //  Burndown (iteration only)
        // ---------------------------------------------------------------

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

        private async Task<List<BurndownPointDTO>> ComputeBurndownAsync(List<Moment> moments)
        {
            var result = new List<BurndownPointDTO>();
            if (moments.Count == 0) return result;

            var startDate = moments.Min(m => m.CreatedAt).Date;
            var today = DateTime.UtcNow.Date;

            var completedDates = moments
                .Where(m => m.CompletedAt.HasValue)
                .Select(m => m.CompletedAt!.Value.Date)
                .ToList();

            DateTime? latestCompleted = completedDates.Count > 0
                ? completedDates.Max()
                : null;
            var endDate = latestCompleted > today ? latestCompleted.Value : today;

            var initialEffort = moments.Sum(m => EstimateToNumeric(m.EffortEstimate));
            var totalDays = (endDate - startDate).Days;
            if (totalDays <= 0) totalDays = 1;

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                var remaining = moments
                    .Where(m => m.CompletedAt == null || m.CompletedAt.Value.Date > date)
                    .Sum(m => EstimateToNumeric(m.EffortEstimate));

                var dayNumber = (date - startDate).Days;
                var idealRemaining = initialEffort - (initialEffort * dayNumber / totalDays);
                if (idealRemaining < 0) idealRemaining = 0;

                result.Add(new BurndownPointDTO
                {
                    Date = date,
                    RemainingEffort = remaining,
                    IdealRemaining = idealRemaining
                });
            }
            return result;
        }

        public async Task<List<BurndownPointDTO>> GetIterationBurndownAsync(int iterationId)
        {
            var assigned = await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly: false);
            var unassigned = await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly: true);
            var allMoments = assigned.Concat(unassigned).GroupBy(m => m.Id).Select(g => g.First()).ToList();
            return await ComputeBurndownAsync(allMoments);
        }
    }
}