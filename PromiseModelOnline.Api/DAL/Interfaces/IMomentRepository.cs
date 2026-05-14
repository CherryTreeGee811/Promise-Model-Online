using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IMomentRepository : IGenericRepository<Moment>
    {
        Task<IEnumerable<Moment>> GetMomentsByFlowAsync(int flowId);
        Task<IEnumerable<Moment>> GetMomentsByStrideAsync(int strideId);
        Task<IEnumerable<Moment>> GetMomentsByIterationAsync(int iterationId, bool unassignedOnly = false);
        Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId);
        Task<IEnumerable<Moment>> GetMomentsByPromiseIdAsync(int promiseId);
        Task<int?> GetProjectIdForMomentAsync(int momentId);
    }
}