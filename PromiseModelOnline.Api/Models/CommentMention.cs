using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class CommentMention
{
    [Key]
    public int Id { get; set; }
        
    public int CommentId { get; set; }
        
    public int MentionedUserId { get; set; }
        
    [ForeignKey("CommentId")]
    public Comment Comment { get; set; } = null!;
        
    [ForeignKey("MentionedUserId")]
    public User MentionedUser { get; set; } = null!;
}