using System.ComponentModel.DataAnnotations;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for inviting a user to a project.</summary>
public class CreatePermissionRequestDto
{
    /// <summary>Email address.</summary>
    public string Email { get; set; } = string.Empty;
    /// <summary>ID of the project.</summary>
    [Required]
    public int ProjectId { get; set; }
    /// <summary>Access level permission.</summary>
    [Required]
    public PermissionLevel Level { get; set; }
}