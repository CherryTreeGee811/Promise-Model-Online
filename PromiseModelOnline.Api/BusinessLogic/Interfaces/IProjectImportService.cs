using PromiseModelOnline.Api.DTOs;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for importing a project from a portable export document.</summary>
/// <remarks>
///   Reconstructs the full promise model hierarchy from an <see cref="ProjectExportDocument"/>,
///   creating entities and their relationships in the database. Scoped lifetime.
/// </remarks>
public interface IProjectImportService
{
    /// <summary>Import a project from an export document.</summary>
    /// <param name="document">The export document containing the project data.</param>
    /// <param name="requestedByUserId">The user ID requesting the import.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An <see cref="ProjectImportResult"/> with success status and any errors.</returns>
    Task<ProjectImportResult> ImportAsync(ProjectExportDocument document, int requestedByUserId, CancellationToken cancellationToken = default);
}
