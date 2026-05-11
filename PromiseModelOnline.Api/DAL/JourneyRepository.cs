using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class JourneyRepository : GenericRepository<Journey>, IJourneyRepository
    {
        public JourneyRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId)
        {
            return await FindAsync(j => j.EpicId == epicId);
        }
    }
}