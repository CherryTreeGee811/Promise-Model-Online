using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Business logic for <see cref="Iteration"/> entities scoped to a parent project.</summary>
/// <remarks>
///   Delegates iteration queries to <see cref="IIterationRepository"/>. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with the iteration repository.</remarks>
/// <param name="iterationRepository">Repository for iteration data access.</param>
public class IterationService(IIterationRepository iterationRepository) : GenericService<Iteration>(iterationRepository), IIterationService
{
    private readonly IIterationRepository _iterationRepository = iterationRepository;

    /// <summary>Return all iterations (time-boxed planning cycles) for a project.</summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>All iterations belonging to the project.</returns>
    public async Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId, CancellationToken cancellationToken = default)
        => await _iterationRepository.GetIterationsByProjectAsync(projectId, cancellationToken);


}
