using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

public class CreateMomentTaskRequestDTO
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsCompleted { get; set; }
}