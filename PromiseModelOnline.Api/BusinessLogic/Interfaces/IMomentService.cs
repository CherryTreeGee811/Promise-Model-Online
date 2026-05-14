using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
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
        Task<IEnumerable<Moment>> GetMomentsByOwnerIdAsync(int ownerId);
        Task<Moment> AssignMomentToStrideAsync(int momentId, int? strideId);
        Task<Moment> UpdateMomentStatusAsync(int momentId, MomentStatus newStatus);
        Task<Moment> UpdateMomentEstimateAsync(int momentId, Estimate? estimate);
        Task<int> GetTotalEffortForPromiseAsync(int promiseId);
        Task<Moment> AssignOwnerAsync(int momentId, int userId);
    }
}