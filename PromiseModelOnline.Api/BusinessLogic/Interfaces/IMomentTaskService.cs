using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IMomentTaskService
    {
        Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId);
        Task<MomentTask?> GetByIdAsync(int taskId);
        Task<MomentTask> CreateAsync(MomentTask task);
        Task<MomentTask> UpdateAsync(MomentTask task);
    }
}