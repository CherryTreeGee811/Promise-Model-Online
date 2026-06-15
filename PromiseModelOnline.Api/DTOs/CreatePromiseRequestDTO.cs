namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new promise.</summary>
public class CreatePromiseRequestDTO
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}