using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IIterationRepository : IGenericRepository<Iteration>
    {
        Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId);
    }
}