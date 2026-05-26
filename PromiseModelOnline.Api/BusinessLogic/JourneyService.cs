using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    public class JourneyService : GenericService<Journey>, IJourneyService
    {
        private readonly IJourneyRepository _journeyRepository;
        private readonly IHierarchyStatusService _hierarchyStatusService;

        public JourneyService(IJourneyRepository journeyRepository, IHierarchyStatusService hierarchyStatusService) : base(journeyRepository)
        {
            _journeyRepository = journeyRepository;
            _hierarchyStatusService = hierarchyStatusService;
        }

        public async Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId)
            => await _journeyRepository.GetJourneysByEpicAsync(epicId);

        public override async Task AddAsync(Journey entity)
        {
            await base.AddAsync(entity);
            await _hierarchyStatusService.RecalculateFromJourneyAsync(entity.Id);
        }

        public override async Task<bool> DeleteByIdAsync(object id)
        {
            var journey = await _journeyRepository.GetByIdAsync(id);
            if (journey is null)
            {
                return false;
            }

            var deleted = await base.DeleteByIdAsync(id);
            if (deleted)
            {
                await _hierarchyStatusService.RecalculateFromEpicAsync(journey.EpicId);
            }

            return deleted;
        }
    }
}