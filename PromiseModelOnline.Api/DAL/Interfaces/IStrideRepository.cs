using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IStrideRepository : IGenericRepository<Stride>
    {
        Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId);
        Task<IEnumerable<Stride>> GetStridesEndingOnAsync(DateTime date);
    }
}