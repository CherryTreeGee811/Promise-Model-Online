using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Root node in the product hierarchy, representing a high-level product goal or feature area.</summary>
/// <remarks>
///   A promise is the top-level entity within a <see cref="Project"/>'s product tree. It contains
///   child <see cref="Epic"/> entities and is identified by a human-readable sequence number
///   within its project (e.g., "Promise-1", "Promise-2").
/// </remarks>
public class Promise
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }

    /// <summary>Entity type discriminator, always <c>"Promise"</c>. Not mapped to the database.</summary>
    [NotMapped]
    public string Type => "Promise";
        
    /// <summary>Short description of the promise. Required, max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
        
    /// <summary>Optional detailed description. Max 2000 characters.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    /// <summary>Foreign key to the parent <see cref="Models.Project"/>.</summary>
    [Required]
    public int ProjectId { get; set; }
    
    /// <summary>Foreign key to the <see cref="User"/> responsible for this promise.</summary>
    public int? OwnerId { get; set; }
        
    /// <summary>Human-readable sequence number, unique within the project.</summary>
    [Required]
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent project's promise list.</summary>
    public int DisplayOrder { get; set; } = 0;
        
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    /// <summary>UTC timestamp of last update, or <c>null</c> if never updated.</summary>
    public DateTime? UpdatedAt { get; set; }
        
    /// <summary>Rolled-up status color derived from child entities. Default <c>"red"</c>.</summary>
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";
        
    /// <summary>The parent project.</summary>
    [ForeignKey("ProjectId")]
    public Project Project { get; set; } = null!;
        
    /// <summary>The responsible user, if assigned.</summary>
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
        
    /// <summary>Child epics within this promise.</summary>
    public ICollection<Epic> Epics { get; set; } = new List<Epic>();
    
    /// <summary>Comments attached to this promise.</summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
