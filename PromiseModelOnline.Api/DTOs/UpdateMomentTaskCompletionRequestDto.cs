using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for toggling a moment sub-task completion.</summary>
public class UpdateMomentTaskCompletionRequestDto
{
    /// <summary>Whether the task is marked complete.</summary>
    [Required]
    public bool IsCompleted { get; set; }
}