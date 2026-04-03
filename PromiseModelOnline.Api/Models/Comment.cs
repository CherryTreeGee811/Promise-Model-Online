using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class Comment
{
    [Key]
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    [Required]
    public string Text { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int? ParentCommentId { get; set; }
    
    public int? ProductPromiseId { get; set; }
    public int? EpicId { get; set; }
    public int? JourneyId { get; set; }
    public int? FlowId { get; set; }
    public int? MomentId { get; set; }
    
    [MaxLength(10)]
    public string? Grade { get; set; }
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    
    [ForeignKey("ParentCommentId")]
    public Comment? ParentComment { get; set; }
    
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public ICollection<CommentMention> Mentions { get; set; } = new List<CommentMention>();
    
    [ForeignKey("ProductPromiseId")]
    public Promise? ProductPromise { get; set; }
    
    [ForeignKey("EpicId")]
    public Epic? Epic { get; set; }
    
    [ForeignKey("JourneyId")]
    public Journey? Journey { get; set; }
    
    [ForeignKey("FlowId")]
    public Flow? Flow { get; set; }
    
    [ForeignKey("MomentId")]
    public Moment? Moment { get; set; }
}