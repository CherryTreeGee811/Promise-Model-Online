using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IStrideService : IGenericService<Stride>
    {
        Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId);
        Task SendDeadlineNotificationsAsync();
        Task<int> GetProjectIdFromIterationAsync(int iterationId);
        Task<int> GetProjectIdAsync(int strideId);
    }
}