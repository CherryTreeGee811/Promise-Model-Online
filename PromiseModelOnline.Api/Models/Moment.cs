using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

public class Moment
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    public int FlowId { get; set; }
    
    // Type attribute - the only distinction between Story and Job
    [Required]
    public MomentType Type { get; set; } = MomentType.Story;
    
    // Example Story: "As a Rider, I request a pickup"
    // Example Job: "Match rider request with available driver"
    
    // Status tracking (Todo, InProgress, Blocked, Done)
    [Required]
    public MomentStatus Status { get; set; } = MomentStatus.Todo;
    
    // T-shirt sizing (XS, S, M, L, XL, XXL, XXXL)
    public Estimate? EffortEstimate { get; set; }
    
    // For Stories: single owner
    // For Jobs: can have multiple assignees (handled by MomentAssignment table)
    public int? OwnerId { get; set; }
    
    public int? AssignedStrideId { get; set; }
    
    public int DisplayOrder { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    // For zombie tracking (moved to next stride)
    public bool IsZombie { get; set; } = false;
    
    public int? OriginalStrideId { get; set; }
    
    //TODO: Enum for glyph colours?
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";
    
    // Navigation properties
    [ForeignKey("FlowId")]
    public Flow Flow { get; set; } = null!;
    
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
    
    [ForeignKey("AssignedStrideId")]
    public Stride? AssignedStride { get; set; }

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<BugReworkTask> BugReworkTasks { get; set; } = new List<BugReworkTask>();
}