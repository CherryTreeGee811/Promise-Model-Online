using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class MomentService : GenericService<Moment>, IMomentService
    {
        private readonly IMomentRepository _momentRepository;

        public MomentService(IMomentRepository momentRepository) : base(momentRepository)
        {
            _momentRepository = momentRepository;
        }

        public async Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId)
            => await _momentRepository.GetMomentsByFlowAsync(flowId);

        public async Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId)
            => await _momentRepository.GetMomentsByStrideAsync(strideId);

        public async Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false)
            => await _momentRepository.GetMomentsByIterationAsync(iterationId, unassignedOnly);
    }
}