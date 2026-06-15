namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for toggling a moment sub-task completion.</summary>
public class UpdateMomentTaskCompletionRequestDTO
{
    /// <summary>Whether the task is marked complete.</summary>
    public bool IsCompleted { get; set; }
}