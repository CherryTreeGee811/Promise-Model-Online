namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new flow.</summary>
public class CreateFlowRequestDTO
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Journey"/>.</summary>
    public int JourneyId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}
