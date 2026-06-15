using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PMO.Core.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

/// <summary>Leaf-level work item in the product hierarchy, representing a single unit of work.</summary>
/// <remarks>
///   A moment is the smallest tracked entity in the promise model. It belongs to a <see cref="Flow"/>
///   and can be assigned to a <see cref="Stride"/> (sprint). It has a <see cref="MomentStatus"/>,
///   an effort <see cref="Estimate"/>, an owner, and may contain sub-<see cref="MomentTask"/> items
///   and <see cref="BugReworkTask"/> items.
/// </remarks>
public class Moment
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }
    
    /// <summary>Short description of the work. Required, max 500 characters.</summary>
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
    
    /// <summary>Optional detailed description. Max 2000 characters.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    /// <summary>Foreign key to the parent <see cref="Models.Flow"/>.</summary>
    public int FlowId { get; set; }
    
    /// <summary>Classification as a <see cref="MomentType.Story"/> or <see cref="MomentType.Job"/>.</summary>
    [Required]
    public MomentType Type { get; set; } = MomentType.Story;
    
    /// <summary>Current workflow status.</summary>
    [Required]
    public MomentStatus Status { get; set; } = MomentStatus.Todo;
    
    /// <summary>Effort estimate using Fibonacci sizing, or <c>null</c> if unestimated.</summary>
    public Estimate? EffortEstimate { get; set; }
    
    /// <summary>Foreign key to the assigned <see cref="User"/>, or <c>null</c> if unassigned.</summary>
    public int? OwnerId { get; set; }
    
    /// <summary>Foreign key to the assigned <see cref="Stride"/> (sprint), or <c>null</c>.</summary>
    public int? AssignedStrideId { get; set; }
    
    /// <summary>Human-readable sequence number, unique within the parent flow.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent flow.</summary>
    public int DisplayOrder { get; set; } = 0;
    
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>UTC timestamp when marked as <c>Done</c>, or <c>null</c>.</summary>
    public DateTime? CompletedAt { get; set; }
    
    /// <summary>Indicates this moment was migrated from a previous stride after stride completion.</summary>
    public bool IsZombie { get; set; } = false;
    
    /// <summary>The stride this moment was originally assigned to, before migration.</summary>
    public int? OriginalStrideId { get; set; }
    
    /// <summary>Status display color derived from <see cref="Status"/>. Default <c>"red"</c>.</summary>
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";
    
    /// <summary>The parent flow.</summary>
    [ForeignKey("FlowId")]
    public Flow Flow { get; set; } = null!;
    
    /// <summary>The assigned user, if any.</summary>
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
    
    /// <summary>The assigned stride, if any.</summary>
    [ForeignKey("AssignedStrideId")]
    public Stride? AssignedStride { get; set; }

    /// <summary>Sub-tasks for this moment.</summary>
    public ICollection<MomentTask> Tasks { get; set; } = new List<MomentTask>();

    /// <summary>Comments attached to this moment.</summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    
    /// <summary>Bug and rework items attached to this moment.</summary>
    public ICollection<BugReworkTask> BugReworkTasks { get; set; } = new List<BugReworkTask>();
}
