namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Journey"/> responses.</summary>
public class JourneyDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Entity type discriminator.</summary>
    public string Type { get; set; } = string.Empty;
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
    /// <summary>Foreign key to the parent <see cref="Models.Epic"/>.</summary>
    public int EpicId { get; set; }
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }
    /// <summary>Human-readable sequence number within the parent scope.</summary>
    public int SequenceNumber { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";
}
