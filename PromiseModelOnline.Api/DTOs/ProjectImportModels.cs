using System.Collections.Generic;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Result of validating a project import document before committing.</summary>
/// <remarks>Populated by <see cref="BusinessLogic.ProjectImportValidationService.ValidateAsync"/>.
/// <see cref="IsValid"/> is <c>true</c> when <see cref="Errors"/> is empty.</remarks>
public sealed class ProjectImportValidationResult
{
    /// <summary>The parsed document, or <c>null</c> if validation failed.</summary>
    public ProjectExportDocument? Document { get; set; }

    /// <summary>Validation errors that prevent import.</summary>
    public List<string> Errors { get; } = new();

    /// <summary>Non-blocking warnings about the import.</summary>
    public List<string> Warnings { get; } = new();

    /// <summary><c>true</c> if the document has no errors.</summary>
    public bool IsValid => Errors.Count == 0;
}

/// <summary>Result of a completed project import operation.</summary>
/// <remarks>Returned by <see cref="BusinessLogic.ProjectImportService.ImportAsync"/>.</remarks>
public sealed class ProjectImportResult
{
    /// <summary>The ID of the newly created project.</summary>
    public int ProjectId { get; set; }

    /// <summary>Non-blocking warnings from the import.</summary>
    public List<string> Warnings { get; set; } = new();

    /// <summary>Slug of the project owner for URL construction.</summary>
    public string? OwnerSlug { get; set; }

    /// <summary>Slug of the imported project.</summary>
    public string? Slug { get; set; }
}
