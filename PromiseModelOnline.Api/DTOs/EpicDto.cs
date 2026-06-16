namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Epic"/> responses.</summary>
/// <remarks>Used by epic endpoints to return epic details without navigation properties.</remarks>
public class EpicDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    
    /// <summary>Entity type discriminator (<c>"Epic"</c>).</summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>Short description.</summary>
    public string Statement { get; set; } = string.Empty;
    
    /// <summary>Optional detailed description.</summary>
    public string? Description { get; set; }
    
    /// <summary>Foreign key to the parent <see cref="Models.Promise"/>.</summary>
    public int ProductPromiseId { get; set; }
    
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, if assigned.</summary>
    public int? OwnerId { get; set; }
    
    /// <summary>Human-readable sequence number within the parent promise.</summary>
    public int SequenceNumber { get; set; }
    
    /// <summary>Sort order within the parent promise.</summary>
    public int DisplayOrder { get; set; }
    
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>Rolled-up status color.</summary>
    public string StatusColor { get; set; } = "red";
}
