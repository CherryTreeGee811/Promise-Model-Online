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
        private readonly IGenericRepository<Epic> _epicRepository;
        private readonly IGenericRepository<Promise> _promiseRepository;

        public JourneyService(
            IJourneyRepository journeyRepository,
            IGenericRepository<Epic> epicRepository,
            IGenericRepository<Promise> promiseRepository)
            : base(journeyRepository)
        {
            _journeyRepository = journeyRepository;
            _epicRepository = epicRepository;
            _promiseRepository = promiseRepository;
        }

        // ✅ Get journeys for an epic
        public async Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId)
        {
            return await _journeyRepository.GetJourneysByEpicAsync(epicId);
        }

        // ✅ Resolve projectId from epicId (used for permissions)
        public async Task<int> GetProjectIdFromEpicAsync(int epicId)
        {
            var epic = await _epicRepository.GetByIdAsync(epicId)
                       ?? throw new KeyNotFoundException("Epic not found");

            var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId)
                          ?? throw new KeyNotFoundException("Promise not found");

            return promise.ProjectId;
        }
    }
}