using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class PromiseService : GenericService<Promise>, IPromiseService
    {
        private readonly IGenericRepository<Promise> _promiseRepository;

        public PromiseService(IGenericRepository<Promise> promiseRepository)
            : base(promiseRepository)
        {
            _promiseRepository = promiseRepository;
        }

        public async Task<int> GetProjectIdAsync(int promiseId)
        {
            var promise = await _promiseRepository.GetByIdAsync(promiseId);

            if (promise == null)
                throw new KeyNotFoundException("Promise not found");

            return promise.ProjectId;
        }
    }
}