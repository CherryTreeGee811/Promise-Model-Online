using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IJourneyService : IGenericService<Journey>
    {
        Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId);
    }
}