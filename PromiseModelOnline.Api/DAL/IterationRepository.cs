using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class IterationRepository : GenericRepository<Iteration>, IIterationRepository
    {
        public IterationRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId)
        {
            return await FindAsync(i => i.ProjectId == projectId);
        }
    }
}