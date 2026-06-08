namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Data Transfer Object for Project entity returned by the API.
/// </summary>
public class ProjectDTO
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int OwnerId { get; set; }

    public string OwnerSlug { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
