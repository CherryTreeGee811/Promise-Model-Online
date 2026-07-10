using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new flow.</summary>
public class CreateFlowRequestDto
{
    /// <summary>Short description of the entity.</summary>
    [Required, MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Journey"/>.</summary>
    [JsonRequired]
    public int JourneyId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    [JsonRequired]
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
}
