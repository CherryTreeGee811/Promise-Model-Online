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
    /// <summary>Business logic for <see cref="Moment"/> entities with status, assignment, and burndown.</summary>
    /// <remarks>
    ///   Implements the richest set of business operations: flow/stride/iteration/owner scoping,
    ///   stride assignment, status transitions, estimate updates, effort aggregation, unfinished
    ///   moment migration between strides, and iteration burndown calculation. Triggers hierarchy
    ///   status recalculation on add/delete. Scoped lifetime.
    /// </remarks>
    public class MomentService : GenericService<Moment>, IMomentService
    {
        private readonly IMomentRepository _momentRepository;
        private readonly IGenericRepository<Stride> _strideRepository;
        private readonly IGenericRepository<Iteration> _iterationRepository;
        private readonly IIterationService _iterationService;
        private readonly IStrideService _strideService;
        private readonly IHierarchyStatusService _hierarchyStatusService;

        /// <summary>Initializes the service with required repositories and services.</summary>
        /// <param name="momentRepository">Repository for moment data access.</param>
        /// <param name="strideRepository">Repository for stride data access.</param>
        /// <param name="iterationRepository">Repository for iteration data access.</param>
        /// <param name="iterationService">Service for iteration operations.</param>
        /// <param name="strideService">Service for stride operations.</param>
        /// <param name="hierarchyStatusService">Service for hierarchy status recalculation.</param>
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

        /// <summary>Return moments belonging to a flow.</summary>
        /// <param name="flowId">The flow ID.</param>
        /// <returns>Moments under the given flow.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
            => await _momentRepository.GetMomentsByFlowAsync(flowId);

        /// <summary>Return moments assigned to a stride (sprint).</summary>
        /// <param name="strideId">The stride ID.</param>
        /// <returns>Moments in the given stride.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
            => await _momentRepository.GetMomentsByStrideAsync(strideId);

        /// <summary>Return moments in an iteration, with optional unassigned-only filter.</summary>
        /// <param name="iterationId">The iteration ID.</param>
        /// <param name="unassignedOnly">If <c>true</c>, only moments without a stride assignment.</param>
        /// <returns>Matching moments in the iteration's project.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
            => await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly);

        /// <summary>Return moments assigned to a user.</summary>
        /// <param name="ownerId">The owner's user ID.</param>
        /// <returns>Moments owned by the user.</returns>
        public async Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId)
            => await _momentRepository.GetMomentsByOwnerIdAsync(ownerId);

        /// <summary>Add a moment and trigger hierarchy status recalculation.</summary>
        public override async Task AddAsync(Moment entity)
        {
            await base.AddAsync(entity);
            await _hierarchyStatusService.RecalculateFromFlowAsync(entity.FlowId);
        }

        /// <summary>Delete a moment and trigger hierarchy status recalculation.</summary>
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

        /// <summary>Assign or unassign a moment to a stride.</summary>
        /// <param name="momentId">The moment ID.</param>
        /// <param name="strideId">The stride ID, or <c>null</c> to unassign.</param>
        /// <returns>The updated moment.</returns>
        /// <exception cref="KeyNotFoundException">Moment or stride not found.</exception>
        /// <exception cref="InvalidOperationException">Stride is not associated with an iteration.</exception>
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

        /// <summary>Update a moment's status with business rules and hierarchy propagation.</summary>
        /// <remarks>
        ///   Sets <c>CompletedAt</c> when status is <see cref="MomentStatus.Done"/>, clears it otherwise.
        ///   Derives the status color from the new status. Triggers hierarchy recalculation.
        /// </remarks>
        /// <param name="momentId">The moment ID.</param>
        /// <param name="newStatus">The target status.</param>
        /// <returns>The updated moment.</returns>
        /// <exception cref="KeyNotFoundException">Moment not found.</exception>
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

        /// <summary>Update a moment's effort estimate.</summary>
        /// <param name="momentId">The moment ID.</param>
        /// <param name="estimate">The new estimate, or <c>null</c> to clear.</param>
        /// <returns>The updated moment.</returns>
        /// <exception cref="KeyNotFoundException">Moment not found.</exception>
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

        /// <summary>Calculate the total numeric effort estimate for all moments under a product promise.</summary>
        /// <param name="promiseId">The product promise ID.</param>
        /// <returns>The sum of all effort estimates.</returns>
        public async Task<int> GetTotalEffortForPromiseAsync(int promiseId)
        {
            var moments = await _momentRepository.GetMomentsByPromiseIdAsync(promiseId);
            return moments.Sum(m => EstimateToNumeric(m.EffortEstimate));
        }

        /// <summary>Assign or unassign an owner to a moment.</summary>
        /// <param name="momentId">The moment ID.</param>
        /// <param name="userId">The owner's user ID, or <c>null</c> to clear.</param>
        /// <returns>The updated moment.</returns>
        /// <exception cref="KeyNotFoundException">Moment not found.</exception>
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

        /// <summary>Resolve the root project ID for a moment.</summary>
        /// <param name="momentId">The moment ID.</param>
        /// <returns>The project ID, or <c>null</c>.</returns>
        public async Task<int?> GetProjectIdForMomentAsync(int momentId)
            => await _momentRepository.GetProjectIdForMomentAsync(momentId);

        /// <summary>Move unfinished moments from a completed stride to the next available stride.</summary>
        /// <remarks>
        ///   Tries the next stride in the same iteration first. If none, looks for the first stride
        ///   of the next iteration. Moments are marked as <c>IsZombie</c> with the original stride
        ///   recorded in <c>OriginalStrideId</c>.
        /// </remarks>
        /// <param name="strideId">The completed stride ID.</param>
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
                        var firstStrideOfNextIteration = (await _strideService.GetStridesByIterationAsync(nextIterations[0].Id))
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

        /// <summary>Map an <see cref="Estimate"/> enum to its numeric Fibonacci value for burndown calculation.</summary>
        /// <param name="estimate">The effort estimate value.</param>
        /// <returns>The numeric effort value.</returns>
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

        /// <summary>Compute burndown chart data points with automatic date range from moment data.</summary>
        /// <param name="moments">The list of moments to compute burndown for.</param>
        /// <returns>A list of burndown data points.</returns>
    private Task<List<BurndownPointDto>> ComputeBurndownAsync(List<Moment> moments)
            => ComputeBurndownAsync(moments, null, null);

    /// <summary>Compute burndown chart data points with optional date range overrides.</summary>
    /// <remarks>Calculates actual remaining effort per day and the ideal burndown line.</remarks>
    private Task<List<BurndownPointDto>> ComputeBurndownAsync(
        List<Moment> moments,
        DateTime? startDateOverride,
        DateTime? endDateOverride)
        {
            var result = new List<BurndownPointDto>();
            if (moments.Count == 0) return Task.FromResult(result);

            var startDate = (startDateOverride ?? moments.Min(m => m.CreatedAt)).Date;
            var computedEndDate = moments
                .Where(m => m.CompletedAt.HasValue)
                .Select(m => m.CompletedAt!.Value.Date)
                .DefaultIfEmpty(DateTime.UtcNow.Date)
                .Max();

            var endDate = (endDateOverride ?? computedEndDate).Date;
            if (endDate < startDate)
                endDate = startDate;

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

                result.Add(new BurndownPointDto
                {
                    Date = date,
                    RemainingEffort = remaining,
                    IdealRemaining = idealRemaining
                });
            }

            return Task.FromResult(result);
        }

        /// <summary>Calculate burndown chart data points for an iteration.</summary>
        /// <param name="iterationId">The iteration ID.</param>
        /// <returns>A list of burndown data points.</returns>
        public async Task<List<BurndownPointDto>> GetIterationBurndownAsync(int iterationId)
        {
            var iterationStrides = (await _strideService.GetStridesByIterationAsync(iterationId)).ToList();
            var assigned = await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly: false);
            var unassigned = await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly: true);
            var allMoments = assigned.Concat(unassigned).GroupBy(m => m.Id).Select(g => g.First()).ToList();

            if (iterationStrides.Count == 0)
            {
                return await ComputeBurndownAsync(allMoments);
            }

            var startDate = iterationStrides
                .Select(stride => stride.StartDate.Date)
                .Min();

            var endDate = iterationStrides
                .Select(stride => stride.EndDate.Date)
                .Max();

            return await ComputeBurndownAsync(allMoments, startDate, endDate);
        }
    }
}