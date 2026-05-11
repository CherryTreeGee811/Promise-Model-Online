using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class IterationService : GenericService<Iteration>, IIterationService
    {
        private readonly IIterationRepository _iterationRepository;

        public IterationService(IIterationRepository iterationRepository) : base(iterationRepository)
        {
            _iterationRepository = iterationRepository;
        }

        public async Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId)
            => await _iterationRepository.GetIterationsByProjectAsync(projectId);
    }
}