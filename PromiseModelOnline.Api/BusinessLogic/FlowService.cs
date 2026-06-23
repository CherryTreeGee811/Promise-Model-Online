using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Flow"/> entities with hierarchy status propagation.</summary>
/// <remarks>
///   Overrides <see cref="GenericService{T}.AddAsync"/> and <see cref="GenericService{T}.DeleteByIdAsync"/>
///   to trigger hierarchy status recalculation. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with repository and hierarchy status service.</remarks>
/// <param name="flowRepository">Repository for flow data access.</param>
/// <param name="hierarchyStatusService">Service for hierarchy status recalculation.</param>
public class FlowService(IFlowRepository flowRepository, IHierarchyStatusService hierarchyStatusService) : GenericService<Flow>(flowRepository), IFlowService
{
    private readonly IFlowRepository _flowRepository = flowRepository;
    private readonly IHierarchyStatusService _hierarchyStatusService = hierarchyStatusService;

    /// <summary>Return all flows belonging to a journey.</summary>
    /// <param name="journeyId">The parent journey ID.</param>
    /// <returns>All flows under the given journey.</returns>
    public async Task<IEnumerable<Flow>> GetFlowsByJourneyAsync(int journeyId)
        => await _flowRepository.GetFlowsByJourneyAsync(journeyId);

    /// <summary>Add a flow and trigger hierarchy status recalculation on its parent journey.</summary>
    /// <param name="entity">The flow to add.</param>
    public override async Task AddAsync(Flow entity)
    {
        await base.AddAsync(entity);
        await _hierarchyStatusService.RecalculateFromFlowAsync(entity.Id);
    }

    /// <summary>Delete a flow and trigger hierarchy status recalculation on its parent journey.</summary>
    /// <param name="id">The flow's primary key.</param>
    /// <returns><c>true</c> if the flow was found and deleted; <c>false</c> otherwise.</returns>
    public override async Task<bool> DeleteByIdAsync(object id)
    {
        var flow = await _flowRepository.GetByIdAsync(id);
        if (flow is null)
        {
            return false;
        }

        var deleted = await base.DeleteByIdAsync(id);
        if (deleted)
        {
            await _hierarchyStatusService.RecalculateFromJourneyAsync(flow.JourneyId);
        }

        return deleted;
    }
}
