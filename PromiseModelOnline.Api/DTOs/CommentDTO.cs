namespace PromiseModelOnline.Api.DTOs;

public class CommentDTO
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string UserName { get; set; } = string.Empty;
    public List<string> MentionedUsers { get; set; } = new();
    public int? ParentCommentId { get; set; }
    public List<CommentDTO> Replies { get; set; } = new();   // for threading later
}