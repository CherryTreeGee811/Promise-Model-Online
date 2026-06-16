using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Fourth-level node in the product hierarchy, grouping moments under a journey.</summary>
/// <remarks>
///   A flow represents a phase or stage within a <see cref="Journey"/>. It contains the actual
///   work items (<see cref="Moment"/>). Identified by a sequence number within its journey
///   (e.g., "Promise-1 / Epic-1 / Journey-1 / Flow-1").
/// </remarks>
public class Flow
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }

    /// <summary>Entity type discriminator, always <c>"Flow"</c>. Not mapped.</summary>
    [NotMapped]
    public string Type => "Flow";
        
    /// <summary>Short description. Required, max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
        
    /// <summary>Optional detailed description. Max 2000 characters.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    /// <summary>Foreign key to the parent <see cref="Models.Journey"/>.</summary>
    [Required]
    public int JourneyId { get; set; }
        
    /// <summary>Foreign key to the responsible <see cref="User"/>.</summary>
    public int? OwnerId { get; set; }
        
    /// <summary>Human-readable sequence number, unique within the parent journey.</summary>
    [Required]
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent journey.</summary>
    public int DisplayOrder { get; set; } = 0;
        
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
        
    /// <summary>Rolled-up status color from child entities. Default <c>"red"</c>.</summary>
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";
        
    /// <summary>The parent journey.</summary>
    [ForeignKey("JourneyId")]
    public Journey Journey { get; set; } = null!;
        
    /// <summary>The responsible user, if assigned.</summary>
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
        
    /// <summary>Child moments (work items) within this flow.</summary>
    public ICollection<Moment> Moments { get; set; } = new List<Moment>();
    
    /// <summary>Comments attached to this flow.</summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
