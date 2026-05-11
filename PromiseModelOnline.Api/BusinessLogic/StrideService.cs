using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class StrideService : GenericService<Stride>, IStrideService
    {
        private readonly IStrideRepository _strideRepository;

        public StrideService(IStrideRepository strideRepository) : base(strideRepository)
        {
            _strideRepository = strideRepository;
        }

        public async Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId)
            => await _strideRepository.GetStridesByIterationAsync(iterationId);
    }
}