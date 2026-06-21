namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Comment"/> responses with user and mention information.</summary>
public class CommentDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Content body text.</summary>
    public string Text { get; set; } = string.Empty;
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>Display name of the user.</summary>
    public string UserName { get; set; } = string.Empty;
    /// <summary>List of mentioned user names.</summary>
    public List<string> MentionedUsers { get; set; } = new();
    /// <summary>Foreign key to the parent comment for replies, or <c>null</c> for top-level.</summary>
    public int? ParentCommentId { get; set; }
    /// <summary>Nested reply DTOs.</summary>
    public List<CommentDto> Replies { get; set; } = new();
}
