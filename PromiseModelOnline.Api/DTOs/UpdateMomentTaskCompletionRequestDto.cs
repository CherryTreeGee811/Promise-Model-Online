using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for toggling a moment sub-task completion.</summary>
public class UpdateMomentTaskCompletionRequestDto
{
    /// <summary>Whether the task is marked complete.</summary>
    [JsonRequired]
    public bool IsCompleted { get; set; }
}