using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="Stride"/> business logic with iteration scoping and deadline automation.</summary>
/// <remarks>
///   Builds on <see cref="IGenericService{T}"/> with iteration-scoped queries and a scheduled
///   job method for sending deadline notifications. Scoped lifetime.
/// </remarks>
public interface IStrideService : IGenericService<Stride>
{
    /// <summary>Return all strides assigned to an iteration.</summary>
    /// <param name="iterationId">The iteration ID. Must be greater than zero.</param>
    /// <returns>All strides in the given iteration.</returns>
    Task<IEnumerable<Stride>> GetStridesByIterationAsync(int iterationId);

    /// <summary>Send deadline notifications for strides ending today.</summary>
    /// <remarks>Called by a scheduled job (Hangfire / background service).</remarks>
    Task SendDeadlineNotificationsAsync();
}
