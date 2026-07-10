using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new project.</summary>
public class ProjectCreateDto
{
    /// <summary>Display name.</summary>
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    /// <summary>Optional description.</summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
}
