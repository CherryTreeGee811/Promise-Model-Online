using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class EpicService : GenericService<Epic>, IEpicService
    {
        private readonly IEpicRepository _epicRepository;
        private readonly IGenericRepository<Promise> _promiseRepository;

        public EpicService(
            IEpicRepository epicRepository,
            IGenericRepository<Promise> promiseRepository)
            : base(epicRepository)
        {
            _epicRepository = epicRepository;
            _promiseRepository = promiseRepository;
        }

        public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId)
            => await _epicRepository.GetEpicsByPromiseAsync(promiseId);
        
        public async Task<int> GetProjectIdFromPromiseAsync(int promiseId)
        {
            var promise = await _promiseRepository.GetByIdAsync(promiseId);

            if (promise == null)
                throw new KeyNotFoundException("Promise not found");

            return promise.ProjectId;
        }
    }
}