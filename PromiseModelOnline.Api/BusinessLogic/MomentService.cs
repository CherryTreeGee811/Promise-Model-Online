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

        public MomentService(
            IMomentRepository momentRepository,
            IGenericRepository<Stride> strideRepository,
            IGenericRepository<Iteration> iterationRepository)
            : base(momentRepository)
        {
            _momentRepository = momentRepository;
            _strideRepository = strideRepository;
            _iterationRepository = iterationRepository;
        }

        // -------------------------------------------------------------------
        //  Existing query methods
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
        //  New planning operations
        // -------------------------------------------------------------------

        /// <summary>
        /// Assigns a moment to a specific stride, or moves it to the backlog
        /// when <paramref name="strideId"/> is <c>null</c>.
        /// </summary>
        public async Task<Moment> AssignMomentToStrideAsync(int momentId, int? strideId)
        {
            var moment = await _momentRepository.GetByIdAsync(momentId)
                         ?? throw new KeyNotFoundException($"Moment with ID {momentId} not found.");

            // Moving to backlog – no further validation needed.
            if (strideId is null)
            {
                moment.AssignedStrideId = null;
                moment.UpdatedAt = DateTime.UtcNow;
                _momentRepository.Update(moment);
                await _momentRepository.SaveChangesAsync();
                return moment;
            }

            // Assigning to a stride – verify the stride exists.
            var stride = await _strideRepository.GetByIdAsync(strideId.Value)
                         ?? throw new KeyNotFoundException($"Stride with ID {strideId} not found.");

            // Ensure the stride belongs to an iteration (it always should, but check).
            if (stride.IterationId is null)
                throw new InvalidOperationException($"Stride with ID {stride.Id} is not associated with an iteration.");

            // Additional validation: later you can verify that the moment's project
            // matches the stride's iteration's project. For now we trust the client.

            moment.AssignedStrideId = stride.Id;
            moment.UpdatedAt = DateTime.UtcNow;
            _momentRepository.Update(moment);
            await _momentRepository.SaveChangesAsync();
            return moment;
        }

        /// <summary>
        /// Changes the status of a moment. If the new status is <see cref="MomentStatus.Done"/>,
        /// the <see cref="Moment.CompletedAt"/> timestamp is set.
        /// </summary>
        public async Task<Moment> UpdateMomentStatusAsync(int momentId, MomentStatus newStatus)
        {
            var moment = await _momentRepository.GetByIdAsync(momentId)
                         ?? throw new KeyNotFoundException($"Moment with ID {momentId} not found.");

            moment.Status = newStatus;
            moment.UpdatedAt = DateTime.UtcNow;

            if (newStatus == MomentStatus.Done)
                moment.CompletedAt = DateTime.UtcNow;
            else
                moment.CompletedAt = null;

            _momentRepository.Update(moment);
            await _momentRepository.SaveChangesAsync();
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
    }
}