using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new journey.</summary>
public class CreateJourneyRequestDto
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Epic"/>.</summary>
    [Required]
    public int EpicId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    [Required]
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}
