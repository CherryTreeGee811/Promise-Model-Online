#pragma warning disable S6964 // Models are EF Core entities, not action input DTOs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Second-level node in the product hierarchy, grouping journeys under a promise.</summary>
/// <remarks>
///   An epic represents a major body of work within a <see cref="Promise"/>. It contains child
///   <see cref="Journey"/> entities and is identified by a sequence number within its promise
///   (e.g., "Promise-1 / Epic-1").
/// </remarks>
public class Epic
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }

    /// <summary>Entity type discriminator, always <c>"Epic"</c>. Not mapped.</summary>
    [NotMapped]
    public string Type => "Epic";

    /// <summary>Short description. Required, max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional detailed description. Max 2000 characters.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Promise"/>.</summary>
    [Required]
    public int ProductPromiseId { get; set; }

    /// <summary>Foreign key to the responsible <see cref="User"/>.</summary>
    public int? OwnerId { get; set; }

    /// <summary>Human-readable sequence number, unique within the parent promise.</summary>
    [Required]
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent promise.</summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Rolled-up status color from child entities. Default <c>"red"</c>.</summary>
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";

    /// <summary>The parent promise.</summary>
    [ForeignKey("ProductPromiseId")]
    public Promise ProductPromise { get; set; } = null!;

    /// <summary>The responsible user, if assigned.</summary>
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }

    /// <summary>Child journeys within this epic.</summary>
    public ICollection<Journey> Journeys { get; set; } = new List<Journey>();

    /// <summary>Comments attached to this epic.</summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
#pragma warning restore S6964
