namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Project"/> responses.</summary>
/// <remarks>Used by project endpoints to return project details without navigation properties.</remarks>
public class ProjectDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-safe slug within the owner's namespace.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the owner <see cref="Models.User"/>.</summary>
    public int OwnerId { get; set; }

    /// <summary>Slug of the owner user, for URL construction.</summary>
    public string OwnerSlug { get; set; } = string.Empty;

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
}
