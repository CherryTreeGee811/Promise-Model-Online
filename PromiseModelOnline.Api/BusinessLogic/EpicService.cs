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
        private readonly IHierarchyStatusService _hierarchyStatusService;

        public EpicService(IEpicRepository epicRepository, IHierarchyStatusService hierarchyStatusService)
            : base(epicRepository)
        {
            _epicRepository = epicRepository;
            _hierarchyStatusService = hierarchyStatusService;
        }

        public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId)
            => await _epicRepository.GetEpicsByPromiseAsync(promiseId);

        public override async Task AddAsync(Epic entity)
        {
            await base.AddAsync(entity);
            await _hierarchyStatusService.RecalculateFromEpicAsync(entity.Id);
        }

        public override async Task<bool> DeleteByIdAsync(object id)
        {
            var epic = await _epicRepository.GetByIdAsync(id);
            if (epic is null)
            {
                return false;
            }

            var deleted = await base.DeleteByIdAsync(id);
            if (deleted)
            {
                await _hierarchyStatusService.RecalculateFromPromiseAsync(epic.ProductPromiseId);
            }

            return deleted;
        }
    }
}