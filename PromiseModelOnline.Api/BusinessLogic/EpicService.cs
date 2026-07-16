using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Epic"/> entities with hierarchy status propagation.</summary>
/// <remarks>
///   Overrides <see cref="GenericService{T}.AddAsync"/> and <see cref="GenericService{T}.DeleteByIdAsync"/>
///   to trigger hierarchy status recalculation. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with repository and hierarchy status service.</remarks>
/// <param name="epicRepository">Repository for epic data access.</param>
/// <param name="hierarchyStatusService">Service for hierarchy status recalculation.</param>
public class EpicService(IEpicRepository epicRepository, IHierarchyStatusService hierarchyStatusService) : GenericService<Epic>(epicRepository), IEpicService
{
    private readonly IEpicRepository _epicRepository = epicRepository;
    private readonly IHierarchyStatusService _hierarchyStatusService = hierarchyStatusService;

    /// <summary>Return all epics belonging to a product promise.</summary>
    /// <param name="promiseId">The parent product promise ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All epics under the given promise.</returns>
    public async Task<IEnumerable<Epic>> GetEpicsByPromiseAsync(int promiseId, CancellationToken cancellationToken = default)
        => await _epicRepository.GetEpicsByPromiseAsync(promiseId, cancellationToken);

    /// <summary>Add an epic and trigger hierarchy status recalculation on its parent promise.</summary>
    /// <param name="entity">The epic to add.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    public override async Task AddAsync(Epic entity, CancellationToken cancellationToken = default)
    {
        await base.AddAsync(entity, cancellationToken);
        await _hierarchyStatusService.RecalculateFromEpicAsync(entity.Id, cancellationToken);
    }

    /// <summary>Delete an epic by ID and trigger hierarchy status recalculation on its parent promise.</summary>
    /// <param name="id">The epic's primary key.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns><c>true</c> if the epic was found and deleted; <c>false</c> otherwise.</returns>
    public override async Task<bool> DeleteByIdAsync(object id, CancellationToken cancellationToken = default)
    {
        var epic = await _epicRepository.GetByIdAsync(id, cancellationToken);
        if (epic is null)
        {
            return false;
        }

        var deleted = await base.DeleteByIdAsync(id, cancellationToken);
        if (deleted)
        {
            await _hierarchyStatusService.RecalculateFromPromiseAsync(epic.ProductPromiseId, cancellationToken);
        }

        return deleted;
    }
}
