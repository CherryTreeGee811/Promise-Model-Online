using PromiseModelOnline.Api.DTOs;
using System.IO;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for validating a project import document before committing the import.</summary>
/// <remarks>
///   Validates the structure, references, and data integrity of a JSON export document
///   without making any changes to the database. Returns validation errors and warnings.
///   Scoped lifetime.
/// </remarks>
public interface IProjectImportValidationService
{
    /// <summary>Validate a project import JSON stream.</summary>
    /// <param name="jsonStream">The JSON stream containing the export document.</param>
    /// <returns>A <see cref="ProjectImportValidationResult"/> with errors and warnings.</returns>
    Task<ProjectImportValidationResult> ValidateAsync(Stream jsonStream);
}
