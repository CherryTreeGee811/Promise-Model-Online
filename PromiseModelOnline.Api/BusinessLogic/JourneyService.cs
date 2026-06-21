using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Journey"/> entities with hierarchy status propagation.</summary>
/// <remarks>
///   Overrides <see cref="GenericService{T}.AddAsync"/> and <see cref="GenericService{T}.DeleteByIdAsync"/>
///   to trigger hierarchy status recalculation. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with repository and hierarchy status service.</remarks>
/// <param name="journeyRepository">Repository for journey data access.</param>
/// <param name="hierarchyStatusService">Service for hierarchy status recalculation.</param>
public class JourneyService(IJourneyRepository journeyRepository, IHierarchyStatusService hierarchyStatusService) : GenericService<Journey>(journeyRepository), IJourneyService
{
    private readonly IJourneyRepository _journeyRepository = journeyRepository;
    private readonly IHierarchyStatusService _hierarchyStatusService = hierarchyStatusService;

    /// <summary>Return all journeys belonging to an epic.</summary>
    /// <param name="epicId">The parent epic ID.</param>
    /// <returns>All journeys under the given epic.</returns>
    public async Task<IEnumerable<Journey>> GetJourneysByEpicAsync(int epicId)
        => await _journeyRepository.GetJourneysByEpicAsync(epicId);

    /// <summary>Add a journey and trigger hierarchy status recalculation on its parent epic.</summary>
    /// <param name="entity">The journey to add.</param>
    public override async Task AddAsync(Journey entity)
    {
        await base.AddAsync(entity);
        await _hierarchyStatusService.RecalculateFromJourneyAsync(entity.Id);
    }

    /// <summary>Delete a journey and trigger hierarchy status recalculation on its parent epic.</summary>
    /// <param name="id">The journey's primary key.</param>
    /// <returns><c>true</c> if the journey was found and deleted; <c>false</c> otherwise.</returns>
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
