using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>Service for recalculating aggregated status values up the hierarchy.</summary>
    /// <remarks>
    ///   When a moment's status changes, this service propagates the aggregated status upward
    ///   through the hierarchy (flow -> journey -> epic -> promise) so parent entities reflect
    ///   the status of their children. Scoped lifetime.
    /// </remarks>
    public interface IHierarchyStatusService
    {
        /// <summary>Recalculate status from a flow upward.</summary>
        /// <param name="flowId">The flow ID whose status changed.</param>
        Task RecalculateFromFlowAsync(int flowId);

        /// <summary>Recalculate status from a journey upward.</summary>
        /// <param name="journeyId">The journey ID whose status changed.</param>
        Task RecalculateFromJourneyAsync(int journeyId);

        /// <summary>Recalculate status from an epic upward.</summary>
        /// <param name="epicId">The epic ID whose status changed.</param>
        Task RecalculateFromEpicAsync(int epicId);

        /// <summary>Recalculate status from a promise upward.</summary>
        /// <param name="promiseId">The promise ID whose status changed.</param>
        Task RecalculateFromPromiseAsync(int promiseId);
    }
}
