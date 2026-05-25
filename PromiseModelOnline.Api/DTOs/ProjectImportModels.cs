using System.Collections.Generic;

namespace PromiseModelOnline.Api.DTOs;

public sealed class ProjectImportValidationResult
{
    public ProjectExportDocument? Document { get; set; }

    public List<string> Errors { get; } = new();

    public List<string> Warnings { get; } = new();

    public bool IsValid => Errors.Count == 0;
}

public sealed class ProjectImportResult
{
    public int ProjectId { get; set; }

    public List<string> Warnings { get; set; } = new();
}