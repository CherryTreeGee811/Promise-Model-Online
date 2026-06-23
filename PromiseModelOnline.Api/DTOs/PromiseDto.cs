namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Promise"/> responses.</summary>
/// <remarks>Used by promise endpoints to return promise details without navigation properties.</remarks>
public class PromiseDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Entity type discriminator (<c>"Promise"</c>).</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Short description.</summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional detailed description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Project"/>.</summary>
    public int ProjectId { get; set; }

    /// <summary>Human-readable sequence number within the project.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the project.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>Rolled-up status color.</summary>
    public string StatusColor { get; set; } = "red";

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
}
