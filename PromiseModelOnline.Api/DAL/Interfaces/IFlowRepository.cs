using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IFlowRepository : IGenericRepository<Flow>
    {
        Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId);
    }
}