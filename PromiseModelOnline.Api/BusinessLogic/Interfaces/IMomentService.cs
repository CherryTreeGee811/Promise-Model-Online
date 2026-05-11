using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IMomentService : IGenericService<Moment>
    {
        Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId);
        Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId);
        Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false);
    }
}