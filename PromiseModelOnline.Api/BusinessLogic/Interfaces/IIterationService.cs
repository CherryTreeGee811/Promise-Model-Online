using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IIterationService : IGenericService<Iteration>
    {
        Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId);
        Task<int> GetProjectIdAsync(int iterationId);
    }
}