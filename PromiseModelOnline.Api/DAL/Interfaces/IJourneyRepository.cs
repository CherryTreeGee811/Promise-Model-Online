using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IJourneyRepository : IGenericRepository<Journey>
    {
        Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId);
    }
}