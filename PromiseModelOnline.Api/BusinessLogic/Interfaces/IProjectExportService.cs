using PromiseModelOnline.Api.DTOs;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for exporting a project's full hierarchy to a portable document.</summary>
/// <remarks>
///   Builds an export document containing the entire promise model tree (promises, epics, journeys,
///   flows, moments) with their statements, statuses, and relationships. Scoped lifetime.
/// </remarks>
public interface IProjectExportService
{
    /// <summary>Build a complete export document for a project.</summary>
    /// <param name="projectId">The project ID to export.</param>
    /// <returns>A <see cref="ProjectExportDocument"/> containing the full hierarchy.</returns>
    Task<ProjectExportDocument> BuildExportAsync(int projectId);
}
