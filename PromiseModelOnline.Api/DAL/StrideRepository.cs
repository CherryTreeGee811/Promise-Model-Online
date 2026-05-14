using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class StrideRepository : GenericRepository<Stride>, IStrideRepository
    {
        public StrideRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId)
        {
            return await FindAsync(s => s.IterationId == iterationId);
        }

        public async Task<IEnumerable<Stride>> GetStridesEndingOnAsync(DateTime date)
        {
            return await FindAsync(s => s.EndDate.Date == date.Date);
        }
    }
}