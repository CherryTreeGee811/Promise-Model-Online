using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IEpicService : IGenericService<Epic>
    {
        Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId);
        Task<int> GetProjectIdFromPromiseAsync(int promiseId);
    }
}