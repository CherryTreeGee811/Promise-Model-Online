using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="IStrideRepository"/> with iteration and date queries.</summary>
/// <remarks>
///   Uses the base class FindAsync method with lambda predicates.
///   Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class StrideRepository(PromiseModelOnlineContext context) : GenericRepository<Stride>(context), IStrideRepository
{

    /// <summary>Return all strides assigned to an iteration.</summary>
    /// <param name="iterationId">The parent iteration ID. Must be greater than zero.</param>
    /// <returns>All strides in the given iteration. Empty if none exist.</returns>
    public async Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId) => await FindAsync(s => s.IterationId == iterationId);

    /// <summary>Return strides whose end date matches a specific date, ignoring time-of-day.</summary>
    /// <remarks>
    ///   Used by scheduled jobs (Hangfire / background service) to detect completed or expired
    ///   sprints. Compares only the date component.
    /// </remarks>
    /// <param name="date">The target date. Time component is ignored.</param>
    /// <returns>Strides ending on the given calendar date. Empty if none.</returns>
    public async Task<IEnumerable<Stride>> GetStridesEndingOnAsync(DateTime date) => await FindAsync(s => s.EndDate.Date == date.Date);
}
