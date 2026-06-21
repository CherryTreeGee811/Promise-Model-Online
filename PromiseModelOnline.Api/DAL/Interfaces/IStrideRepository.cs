using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Stride"/> entities with iteration and date queries.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with iteration-scoped lookups and a date-based
///   query used by the deadline automation to detect recently-completed sprints. Scoped lifetime.
/// </remarks>
public interface IStrideRepository : IGenericRepository<Stride>
{
    /// <summary>Return all strides assigned to an iteration.</summary>
    /// <param name="iterationId">The parent <c>IterationId</c>. Must be greater than zero.</param>
    /// <returns>All strides in the given iteration. Empty if none exist.</returns>
    Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId);

    /// <summary>Return strides whose end date matches a specific date.</summary>
    /// <remarks>
    ///   Performs a calendar-date comparison (ignoring time-of-day) so that strides ending at
    ///   any time on <paramref name="date"/> are returned. Used by scheduled jobs (Hangfire /
    ///   background service) to trigger end-of-stride processing.
    /// </remarks>
    /// <param name="date">The target date. Only the date component is used; time is ignored.</param>
    /// <returns>Strides ending on the given calendar date. Empty if none.</returns>
    Task<IEnumerable<Stride>> GetStridesEndingOnAsync(DateTime date);
}
