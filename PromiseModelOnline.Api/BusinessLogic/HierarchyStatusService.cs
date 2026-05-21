using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class HierarchyStatusService : IHierarchyStatusService
    {
        private readonly IGenericRepository<Promise> _promiseRepository;
        private readonly IEpicRepository _epicRepository;
        private readonly IJourneyRepository _journeyRepository;
        private readonly IFlowRepository _flowRepository;
        private readonly IMomentRepository _momentRepository;

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

        public async Task RecalculateFromPromiseAsync(int promiseId)
        {
            var promise = await _promiseRepository.GetByIdAsync(promiseId)
                         ?? throw new KeyNotFoundException($"Promise with ID {promiseId} not found.");

            await RecalculatePromiseAsync(promise);
            await _promiseRepository.SaveChangesAsync();
        }

        private async Task RecalculateFlowAsync(Flow flow)
        {
            var moments = await _momentRepository.GetMomentsByFlowAsync(flow.Id);
            flow.StatusColor = StatusColorRules.RollUp(moments.Select(moment => moment.StatusColor));
            flow.UpdatedAt = DateTime.UtcNow;
            _flowRepository.Update(flow);
        }

        private async Task RecalculateJourneyAsync(Journey journey)
        {
            var flows = await _flowRepository.GetFlowsByJourneyAsync(journey.Id);
            journey.StatusColor = StatusColorRules.RollUp(flows.Select(flow => flow.StatusColor));
            journey.UpdatedAt = DateTime.UtcNow;
            _journeyRepository.Update(journey);
        }

        private async Task RecalculateEpicAsync(Epic epic)
        {
            var journeys = await _journeyRepository.GetJourneysByEpicAsync(epic.Id);
            epic.StatusColor = StatusColorRules.RollUp(journeys.Select(journey => journey.StatusColor));
            epic.UpdatedAt = DateTime.UtcNow;
            _epicRepository.Update(epic);
        }

        private async Task RecalculatePromiseAsync(Promise promise)
        {
            var epics = await _epicRepository.GetEpicsByPromiseAsync(promise.Id);
            promise.StatusColor = StatusColorRules.RollUp(epics.Select(epic => epic.StatusColor));
            promise.UpdatedAt = DateTime.UtcNow;
            _promiseRepository.Update(promise);
        }
    }
}