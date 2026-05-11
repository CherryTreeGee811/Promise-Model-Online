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

        public FlowService(IFlowRepository flowRepository) : base(flowRepository)
        {
            _flowRepository = flowRepository;
        }

        public async Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId)
            => await _flowRepository.GetFlowsByJourneyAsync(journeyId);
    }
}