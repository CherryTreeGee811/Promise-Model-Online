using PromiseModelOnline.Api.Models;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IPromiseService : IGenericService<Promise>
    {
        Task<int> GetProjectIdAsync(int promiseId);
    }
}