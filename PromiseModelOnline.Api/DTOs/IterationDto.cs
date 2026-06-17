using System;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Iteration"/> responses.</summary>
public class IterationDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
}