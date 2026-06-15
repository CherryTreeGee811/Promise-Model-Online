using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Aggregates child statuses upward through the hierarchy.</summary>
    /// <remarks>
    ///   When a moment's status changes, this service recalculates the aggregated status of its
    ///   parent entities (flow, journey, epic, promise) based on the statuses of their children.
    ///   Walks the hierarchy recursively from the point of change to the root. Scoped lifetime.
    /// </remarks>
    public class HierarchyStatusService : IHierarchyStatusService
    {
        private readonly IGenericRepository<Promise> _promiseRepository;
        private readonly IEpicRepository _epicRepository;
        private readonly IJourneyRepository _journeyRepository;
        private readonly IFlowRepository _flowRepository;
        private readonly IMomentRepository _momentRepository;

        /// <summary>Initializes the service with all hierarchy repositories.</summary>
        /// <param name="promiseRepository">Repository for promise data access.</param>
        /// <param name="epicRepository">Repository for epic data access.</param>
        /// <param name="journeyRepository">Repository for journey data access.</param>
        /// <param name="flowRepository">Repository for flow data access.</param>
        /// <param name="momentRepository">Repository for moment data access.</param>
        public HierarchyStatusService(
            IGenericRepository<Promise> promiseRepository,
            IEpicRepository epicRepository,
            IJourneyRepository journeyRepository,
            IFlowRepository flowRepository,
            IMomentRepository momentRepository)
        {
            _promiseRepository = promiseRepository;
            _epicRepository = epicRepository;
            _journeyRepository = journeyRepository;
            _flowRepository = flowRepository;
            _momentRepository = momentRepository;
        }

        /// <summary>Recalculate status from a flow upward through the hierarchy to the root promise.</summary>
        /// <param name="flowId">The flow ID whose children changed.</param>
        /// <exception cref="KeyNotFoundException">Flow, journey, epic, or promise not found.</exception>
        public async Task RecalculateFromFlowAsync(int flowId)
        {
            var flow = await _flowRepository.GetByIdAsync(flowId)
                       ?? throw new KeyNotFoundException($"Flow with ID {flowId} not found.");

            await RecalculateFlowAsync(flow);

            var journey = await _journeyRepository.GetByIdAsync(flow.JourneyId)
                         ?? throw new KeyNotFoundException($"Journey with ID {flow.JourneyId} not found.");
            await RecalculateJourneyAsync(journey);

            var epic = await _epicRepository.GetByIdAsync(journey.EpicId)
                      ?? throw new KeyNotFoundException($"Epic with ID {journey.EpicId} not found.");
            await RecalculateEpicAsync(epic);

            var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                         ?? throw new KeyNotFoundException($"Promise with ID {epic.ProductPromiseId} not found.");
            await RecalculatePromiseAsync(promise);

            await _flowRepository.SaveChangesAsync();
        }

        /// <summary>Recalculate status from a journey upward through the hierarchy to the root promise.</summary>
        /// <param name="journeyId">The journey ID whose children changed.</param>
        /// <exception cref="KeyNotFoundException">Journey, epic, or promise not found.</exception>
        public async Task RecalculateFromJourneyAsync(int journeyId)
        {
            var journey = await _journeyRepository.GetByIdAsync(journeyId)
                         ?? throw new KeyNotFoundException($"Journey with ID {journeyId} not found.");

            await RecalculateJourneyAsync(journey);

            var epic = await _epicRepository.GetByIdAsync(journey.EpicId)
                      ?? throw new KeyNotFoundException($"Epic with ID {journey.EpicId} not found.");
            await RecalculateEpicAsync(epic);

            var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                         ?? throw new KeyNotFoundException($"Promise with ID {epic.ProductPromiseId} not found.");
            await RecalculatePromiseAsync(promise);

            await _journeyRepository.SaveChangesAsync();
        }

        /// <summary>Recalculate status from an epic upward to the root promise.</summary>
        /// <param name="epicId">The epic ID whose children changed.</param>
        /// <exception cref="KeyNotFoundException">Epic or promise not found.</exception>
        public async Task RecalculateFromEpicAsync(int epicId)
        {
            var epic = await _epicRepository.GetByIdAsync(epicId)
                      ?? throw new KeyNotFoundException($"Epic with ID {epicId} not found.");

            await RecalculateEpicAsync(epic);

            var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                         ?? throw new KeyNotFoundException($"Promise with ID {epic.ProductPromiseId} not found.");
            await RecalculatePromiseAsync(promise);

            await _epicRepository.SaveChangesAsync();
        }

        /// <summary>Recalculate the status of a promise based on its child epics.</summary>
        /// <param name="promiseId">The promise ID whose children changed.</param>
        /// <exception cref="KeyNotFoundException">Promise not found.</exception>
        public async Task RecalculateFromPromiseAsync(int promiseId)
        {
            var promise = await _promiseRepository.GetByIdAsync(promiseId)
                         ?? throw new KeyNotFoundException($"Promise with ID {promiseId} not found.");

            await RecalculatePromiseAsync(promise);
            await _promiseRepository.SaveChangesAsync();
        }

        /// <summary>Recalculate a flow's status color from its child moments.</summary>
        private async Task RecalculateFlowAsync(Flow flow)
        {
            var moments = await _momentRepository.GetMomentsByFlowAsync(flow.Id);
            flow.StatusColor = StatusColorRules.RollUp(moments.Select(moment => moment.StatusColor));
            flow.UpdatedAt = DateTime.UtcNow;
            _flowRepository.Update(flow);
        }

        /// <summary>Recalculate a journey's status color from its child flows.</summary>
        /// <param name="journey">The journey entity.</param>
        private async Task RecalculateJourneyAsync(Journey journey)
        {
            var flows = await _flowRepository.GetFlowsByJourneyAsync(journey.Id);
            journey.StatusColor = StatusColorRules.RollUp(flows.Select(flow => flow.StatusColor));
            journey.UpdatedAt = DateTime.UtcNow;
            _journeyRepository.Update(journey);
        }

        /// <summary>Recalculate an epic's status color from its child journeys.</summary>
        private async Task RecalculateEpicAsync(Epic epic)
        {
            var journeys = await _journeyRepository.GetJourneysByEpicAsync(epic.Id);
            epic.StatusColor = StatusColorRules.RollUp(journeys.Select(journey => journey.StatusColor));
            epic.UpdatedAt = DateTime.UtcNow;
            _epicRepository.Update(epic);
        }

        /// <summary>Recalculate a promise's status color from its child epics.</summary>
        /// <param name="promise">The promise entity.</param>
        private async Task RecalculatePromiseAsync(Promise promise)
        {
            var epics = await _epicRepository.GetEpicsByPromiseAsync(promise.Id);
            promise.StatusColor = StatusColorRules.RollUp(epics.Select(epic => epic.StatusColor));
            promise.UpdatedAt = DateTime.UtcNow;
            _promiseRepository.Update(promise);
        }
    }
}