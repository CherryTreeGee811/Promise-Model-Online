using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Repository for <see cref="Iteration"/> entities scoped to a parent project.</summary>
/// <remarks>
///   Extends <see cref="IGenericRepository{T}"/> with a single query to retrieve all iterations
///   (time-boxed planning cycles) for a project. Scoped lifetime.
/// </remarks>
public interface IIterationRepository : IGenericRepository<Iteration>
{
    /// <summary>Return all iterations for a project.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>All iterations belonging to the project.</returns>
    Task<IEnumerable<Iteration>> GetIterationsByProjectAsync(int projectId);
}
