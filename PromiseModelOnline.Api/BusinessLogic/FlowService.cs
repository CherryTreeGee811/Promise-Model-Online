using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class FlowService : GenericService<Flow>, IFlowService
    {
        private readonly IFlowRepository _flowRepository;
        private readonly IJourneyRepository _journeyRepository;
        private readonly IGenericRepository<Epic> _epicRepository;
        private readonly IGenericRepository<Promise> _promiseRepository;

        public FlowService(
            IFlowRepository flowRepository,
            IJourneyRepository journeyRepository,
            IGenericRepository<Epic> epicRepository,
            IGenericRepository<Promise> promiseRepository)
            : base(flowRepository)
        {
            _flowRepository = flowRepository;
            _journeyRepository = journeyRepository;
            _epicRepository = epicRepository;
            _promiseRepository = promiseRepository;
        }

        public async Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId)
            => await _flowRepository.GetFlowsByJourneyAsync(journeyId);

        public async Task<int> GetProjectIdFromJourneyAsync(int journeyId)
        {
            var journey = await _journeyRepository.GetByIdAsync(journeyId)
                        ?? throw new KeyNotFoundException("Journey not found");

            var epic = await _epicRepository.GetByIdAsync(journey.EpicId)
                    ?? throw new KeyNotFoundException("Epic not found");

            var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                        ?? throw new KeyNotFoundException("Promise not found");

            return promise.ProjectId;
        }
    }
}