using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IHierarchyStatusService
    {
        Task RecalculateFromFlowAsync(int flowId);
        Task RecalculateFromJourneyAsync(int journeyId);
        Task RecalculateFromEpicAsync(int epicId);
        Task RecalculateFromPromiseAsync(int promiseId);
    }
}