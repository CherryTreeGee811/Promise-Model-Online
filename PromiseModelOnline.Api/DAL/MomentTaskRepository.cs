using Microsoft.EntityFrameworkCore;
using PMO.Core.Models;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class MomentTaskRepository : GenericRepository<MomentTask>, IMomentTaskRepository
    {
        public MomentTaskRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<MomentTask>> GetTasksByMomentAsync(int momentId)
        {
            return await _context.Set<MomentTask>()
                .Where(task => task.MomentId == momentId)
                .OrderBy(task => task.Id)
                .ToListAsync();
        }
    }
}