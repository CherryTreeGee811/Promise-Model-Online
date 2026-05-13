namespace PromiseModelOnline.Api.DTOs;

public class CreateCommentDTO
{
    public string Text { get; set; } = string.Empty;
    public string ParentType { get; set; } = string.Empty;   // "Promise", "Epic", "Journey", "Flow", "Moment"
    public int ParentId { get; set; }
    public int? ParentCommentId { get; set; }                  // if replying to a comment
}