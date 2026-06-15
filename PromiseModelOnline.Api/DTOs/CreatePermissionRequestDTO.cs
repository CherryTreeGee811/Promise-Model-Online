using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for inviting a user to a project.</summary>
public class CreatePermissionRequestDTO
{
    /// <summary>Email address.</summary>
    public string Email { get; set; } = string.Empty;
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }
    /// <summary>Access level permission.</summary>
    public PermissionLevel Level { get; set; }
}