using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IEpicRepository : IGenericRepository<Epic>
    {
        Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId);
    }
}