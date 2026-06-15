using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Third-level node in the product hierarchy, grouping flows under an epic.</summary>
/// <remarks>
///   A journey represents a logical sequence of flows within an <see cref="Epic"/>.
///   Identified by a sequence number within its epic (e.g., "Promise-1 / Epic-1 / Journey-1").
/// </remarks>
public class Journey
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }

    /// <summary>Entity type discriminator, always <c>"Journey"</c>. Not mapped.</summary>
    [NotMapped]
    public string Type => "Journey";
        
    /// <summary>Short description. Required, max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
        
    /// <summary>Optional detailed description. Max 2000 characters.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    /// <summary>Foreign key to the parent <see cref="Models.Epic"/>.</summary>
    public int EpicId { get; set; }
        
    /// <summary>Foreign key to the responsible <see cref="User"/>.</summary>
    public int? OwnerId { get; set; }
        
    /// <summary>Human-readable sequence number, unique within the parent epic.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent epic.</summary>
    public int DisplayOrder { get; set; } = 0;
        
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
        
    /// <summary>Rolled-up status color from child entities. Default <c>"red"</c>.</summary>
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";
        
    /// <summary>The parent epic.</summary>
    [ForeignKey("EpicId")]
    public Epic Epic { get; set; } = null!;
        
    /// <summary>The responsible user, if assigned.</summary>
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
        
    /// <summary>Child flows within this journey.</summary>
    public ICollection<Flow> Flows { get; set; } = new List<Flow>();
    
    /// <summary>Comments attached to this journey.</summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
