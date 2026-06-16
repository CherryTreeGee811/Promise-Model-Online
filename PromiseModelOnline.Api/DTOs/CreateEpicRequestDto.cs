using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new epic.</summary>
public class CreateEpicRequestDto
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Promise"/>.</summary>
    [Required]
    public int ProductPromiseId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    [Required]
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}
