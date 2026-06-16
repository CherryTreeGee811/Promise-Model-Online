using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new moment sub-task.</summary>
public class CreateMomentTaskRequestDto
{
    /// <summary>Task display name. Required, max 200 characters.</summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Task description. Max 500 characters.</summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>Whether the task is initially marked complete.</summary>
    [Required]
    public bool IsCompleted { get; set; }
}
