using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IFlowService : IGenericService<Flow>
    {
        Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId);
    }
}