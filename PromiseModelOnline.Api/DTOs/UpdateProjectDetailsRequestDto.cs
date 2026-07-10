using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating project name and description.</summary>
public class UpdateProjectDetailsRequestDto
{
    /// <summary>New display name. Required.</summary>
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>New description. Optional.</summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
}
