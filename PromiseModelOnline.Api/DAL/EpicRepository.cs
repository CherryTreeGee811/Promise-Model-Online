using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class EpicRepository : GenericRepository<Epic>, IEpicRepository
    {
        public EpicRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId)
        {
            return await FindAsync(e => e.ProductPromiseId == promiseId);
        }
    }
}