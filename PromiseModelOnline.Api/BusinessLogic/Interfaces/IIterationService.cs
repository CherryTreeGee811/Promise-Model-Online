using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for <see cref="Iteration"/> business logic scoped to a parent project.</summary>
/// <remarks>
///   Builds on <see cref="IGenericService{T}"/> with project-scoped iteration queries.
///   Scoped lifetime.
/// </remarks>
public interface IIterationService : IGenericService<Iteration>
{
    /// <summary>Return all iterations (time-boxed planning cycles) for a project.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>All iterations belonging to the project.</returns>
    Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId);
}
