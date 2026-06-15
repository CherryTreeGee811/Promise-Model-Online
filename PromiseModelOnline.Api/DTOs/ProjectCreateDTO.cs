namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new project.</summary>
public class ProjectCreateDTO
{
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}
