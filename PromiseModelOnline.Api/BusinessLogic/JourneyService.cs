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

        public JourneyService(IJourneyRepository journeyRepository) : base(journeyRepository)
        {
            _journeyRepository = journeyRepository;
        }

        public async Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId)
            => await _journeyRepository.GetJourneysByEpicAsync(epicId);
    }
}