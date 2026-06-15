using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>An emoji-style reaction on a stack item (moment, flow, comment, etc.).</summary>
/// <remarks>
///   Uses a polymorphic key (<c>StackItemType</c> + <c>StackItemId</c>) to support reactions on
///   any entity type without multiple foreign key columns. Each user may have at most one reaction
///   per stack item. Toggle logic is handled by <see cref="BusinessLogic.ReactionService"/>.
/// </remarks>
public class Reaction
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }

    /// <summary>Foreign key to the <see cref="Models.User"/> who placed the reaction.</summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>The emoji string (e.g., <c>"thumbsup"</c>, <c>"heart"</c>). Required, max 20 characters.</summary>
    [Required]
    [MaxLength(20)]
    public string Emote { get; set; } = string.Empty;

    /// <summary>Type discriminator for the target entity (e.g., <c>"moment"</c>, <c>"flow"</c>, <c>"comment"</c>). Required, max 20 characters.</summary>
    [Required]
    [MaxLength(20)]
    public string StackItemType { get; set; } = string.Empty;

    /// <summary>Foreign key to the target entity's ID.</summary>
    [Required]
    public int StackItemId { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>The user who placed the reaction.</summary>
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
