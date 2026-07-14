using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for inviting a user to a project.</summary>
public class CreatePermissionRequestDto
{
    /// <summary>Email address or username of the user to invite.</summary>
    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;
    /// <summary>Access level to grant.</summary>
    [JsonRequired]
    public PermissionLevel Level { get; set; }
}
