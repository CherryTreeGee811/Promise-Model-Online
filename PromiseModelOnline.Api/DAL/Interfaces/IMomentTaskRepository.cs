using PMO.Core.Models;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IMomentTaskRepository : IGenericRepository<MomentTask>
    {
        Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId);
    }
}