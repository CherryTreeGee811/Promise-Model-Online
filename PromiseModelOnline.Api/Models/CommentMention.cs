using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Links a <see cref="Models.Comment"/> to a mentioned <see cref="Models.User"/> for notification dispatch.</summary>
/// <remarks>
///   Created when the comment text contains <c>@username</c> references. Used by
///   <see cref="BusinessLogic.CommentService"/> to trigger mention notifications.
/// </remarks>
public class CommentMention
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }
        
    /// <summary>Foreign key to the <see cref="Models.Comment"/> containing the mention.</summary>
    public int CommentId { get; set; }
        
    /// <summary>Foreign key to the mentioned <see cref="Models.User"/>.</summary>
    public int MentionedUserId { get; set; }
        
    /// <summary>The comment containing the mention.</summary>
    [ForeignKey("CommentId")]
    public Comment Comment { get; set; } = null!;
        
    /// <summary>The mentioned user.</summary>
    [ForeignKey("MentionedUserId")]
    public User MentionedUser { get; set; } = null!;
}
