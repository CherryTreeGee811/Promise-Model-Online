using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new comment.</summary>
public class CreateCommentDto
{
    /// <summary>Comment body text.</summary>
    public string Text { get; set; } = string.Empty;
    
    /// <summary>Parent entity type: <c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, or <c>"moment"</c>.</summary>
    public string ParentType { get; set; } = string.Empty;
    
    /// <summary>Parent entity ID.</summary>
    [Required]
    public int ParentId { get; set; }
    
    /// <summary>Parent comment ID for replies, or <c>null</c> for top-level comments.</summary>
    public int? ParentCommentId { get; set; }
}
