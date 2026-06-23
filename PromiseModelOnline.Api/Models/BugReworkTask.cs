using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

/// <summary>Tracks a defect or rework item identified during review of a <see cref="Moment"/>.</summary>
/// <remarks>
///   Bug/rework tasks are linked to a specific <see cref="Comment"/> (the review comment that
///   identified the issue) and have their own workflow status independent of the parent moment.
/// </remarks>
public class BugReworkTask
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }

    /// <summary>Short title. Required, max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    /// <summary>Optional detailed description. Max 2000 characters.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>Foreign key to the source <see cref="Comment"/> that identified this issue.</summary>
    public int SourceCommentId { get; set; }

    /// <summary>Foreign key to the parent <see cref="Moment"/>.</summary>
    public int MomentId { get; set; }

    /// <summary>Foreign key to the assigned <see cref="User"/>, or <c>null</c>.</summary>
    public int? AssignedToId { get; set; }

    /// <summary>Current status in the bug/rework workflow.</summary>
    public BugReworkStatus Status { get; set; } = BugReworkStatus.Open;

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UTC timestamp when resolved, or <c>null</c>.</summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>The source comment.</summary>
    [ForeignKey("SourceCommentId")]
    public Comment SourceComment { get; set; } = null!;

    /// <summary>The parent moment.</summary>
    [ForeignKey("MomentId")]
    public Moment Moment { get; set; } = null!;

    /// <summary>The assigned user, if any.</summary>
    [ForeignKey("AssignedToId")]
    public User? AssignedTo { get; set; }
}
