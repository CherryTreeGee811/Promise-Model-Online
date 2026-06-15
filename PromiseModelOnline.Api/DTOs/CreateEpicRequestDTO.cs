namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new epic.</summary>
public class CreateEpicRequestDTO
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Promise"/>.</summary>
    public int ProductPromiseId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}
