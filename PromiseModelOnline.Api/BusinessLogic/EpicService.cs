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

        public EpicService(IEpicRepository epicRepository)
            : base(epicRepository)
        {
            _epicRepository = epicRepository;
        }

        public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId)
            => await _epicRepository.GetEpicsByPromiseAsync(promiseId);
    }
}