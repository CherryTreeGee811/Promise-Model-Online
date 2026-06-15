namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating an entity's description.</summary>
public class UpdateDescriptionRequestDTO
{
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}