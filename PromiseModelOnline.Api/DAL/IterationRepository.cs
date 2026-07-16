using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IIterationRepository"/> providing project-scoped iteration lookups.</summary>
/// <remarks>
///   Uses the base class FindAsync method with a lambda predicate.
///   Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class IterationRepository(PromiseModelOnlineContext context) : GenericRepository<Iteration>(context), IIterationRepository
{

    /// <summary>Return all iterations (time-boxed planning cycles) for a project.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>All iterations belonging to the project.</returns>
    public async Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId, CancellationToken cancellationToken = default) => await FindAsync(i => i.ProjectId == projectId, cancellationToken);
}
