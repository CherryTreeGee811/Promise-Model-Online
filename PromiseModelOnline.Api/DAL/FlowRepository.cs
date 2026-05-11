using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class FlowRepository : GenericRepository<Flow>, IFlowRepository
    {
        public FlowRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId)
        {
            return await FindAsync(f => f.JourneyId == journeyId);
        }
    }
}