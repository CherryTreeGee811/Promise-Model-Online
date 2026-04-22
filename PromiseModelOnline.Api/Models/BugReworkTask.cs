using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

public class BugReworkTask
{
    
    [Key]
    public int Id { get; set; }
        
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
        
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    public int SourceCommentId { get; set; } // Comment that created this task
        
    public int MomentId { get; set; }
        
    public int? AssignedToId { get; set; }
        
    public BugReworkStatus Status { get; set; } = BugReworkStatus.Open;
        
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    public DateTime? ResolvedAt { get; set; }
        
    [ForeignKey("SourceCommentId")]
    public Comment SourceComment { get; set; } = null!;
        
    [ForeignKey("MomentId")]
    public Moment Moment { get; set; } = null!;
        
    [ForeignKey("AssignedToId")]
    public User? AssignedTo { get; set; }
}