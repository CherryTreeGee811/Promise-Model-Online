using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>A comment or reply attached to any entity in the stack hierarchy.</summary>
/// <remarks>
///   Comments use a polymorphic parent model: exactly one of <c>ProductPromiseId</c>, <c>EpicId</c>,
///   <c>JourneyId</c>, <c>FlowId</c>, or <c>MomentId</c> is set. Replies are supported via
///   <see cref="ParentCommentId"/>. Mentions are tracked in <see cref="CommentMention"/>.
/// </remarks>
public class Comment
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }
    
    /// <summary>Foreign key to the author <see cref="User"/>.</summary>
    public int UserId { get; set; }
    
    /// <summary>Comment body text. Required.</summary>
    [Required]
    public string Text { get; set; } = string.Empty;
    
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>Foreign key to the parent comment if this is a reply, or <c>null</c> for top-level comments.</summary>
    public int? ParentCommentId { get; set; }
    
    /// <summary>Foreign key to the parent promise, if attached to a promise.</summary>
    public int? ProductPromiseId { get; set; }
    
    /// <summary>Foreign key to the parent epic, if attached to an epic.</summary>
    public int? EpicId { get; set; }
    
    /// <summary>Foreign key to the parent journey, if attached to a journey.</summary>
    public int? JourneyId { get; set; }
    
    /// <summary>Foreign key to the parent flow, if attached to a flow.</summary>
    public int? FlowId { get; set; }
    
    /// <summary>Foreign key to the parent moment, if attached to a moment.</summary>
    public int? MomentId { get; set; }
    
    /// <summary>Optional grade assigned to this comment (academic context). Max 10 characters.</summary>
    [MaxLength(10)]
    public string? Grade { get; set; }
    
    /// <summary>The author.</summary>
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    /// <summary>The parent comment if this is a reply.</summary>
    [ForeignKey("ParentCommentId")]
    public Comment? ParentComment { get; set; }
    
    /// <summary>Child replies.</summary>
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
    
    /// <summary>User mentions within this comment.</summary>
    public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
    
    /// <summary>The parent promise, if applicable.</summary>
    [ForeignKey("ProductPromiseId")]
    public Promise? ProductPromise { get; set; }
    
    /// <summary>The parent epic, if applicable.</summary>
    [ForeignKey("EpicId")]
    public Epic? Epic { get; set; }
    
    /// <summary>The parent journey, if applicable.</summary>
    [ForeignKey("JourneyId")]
    public Journey? Journey { get; set; }
    
    /// <summary>The parent flow, if applicable.</summary>
    [ForeignKey("FlowId")]
    public Flow? Flow { get; set; }
    
    /// <summary>The parent moment, if applicable.</summary>
    [ForeignKey("MomentId")]
    public Moment? Moment { get; set; }
}
