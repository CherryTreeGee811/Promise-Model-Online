using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating an entity's description.</summary>
public class UpdateDescriptionRequestDto
{
    /// <summary>Optional description.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
}
