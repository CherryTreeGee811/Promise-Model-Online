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
        private readonly IHierarchyStatusService _hierarchyStatusService;

        public FlowService(IFlowRepository flowRepository, IHierarchyStatusService hierarchyStatusService) : base(flowRepository)
        {
            _flowRepository = flowRepository;
            _hierarchyStatusService = hierarchyStatusService;
        }

        public async Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId)
            => await _flowRepository.GetFlowsByJourneyAsync(journeyId);

        public override async Task AddAsync(Flow entity)
        {
            await base.AddAsync(entity);
            await _hierarchyStatusService.RecalculateFromFlowAsync(entity.Id);
        }

        public override async Task<bool> DeleteByIdAsync(object id)
        {
            var flow = await _flowRepository.GetByIdAsync(id);
            if (flow is null)
            {
                return false;
            }

            var deleted = await base.DeleteByIdAsync(id);
            if (deleted)
            {
                await _hierarchyStatusService.RecalculateFromJourneyAsync(flow.JourneyId);
            }

            return deleted;
        }
    }
}