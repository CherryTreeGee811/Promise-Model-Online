using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Auth.Models;

/// <summary>Request body for changing a user's password.</summary>
public class ChangePasswordRequest
{
    /// <summary>The user's current password for verification.</summary>
    [Required]
    [StringLength(128)]
    [JsonPropertyName("currentPassword")]
    public string? CurrentPassword { get; set; }

    /// <summary>The desired new password.</summary>
    [Required]
    [StringLength(128, MinimumLength = 8)]
    [JsonPropertyName("newPassword")]
    public string? NewPassword { get; set; }

    /// <summary>Confirmation of the new password (must match <see cref="NewPassword"/>).</summary>
    [Required]
    [StringLength(128)]
    [JsonPropertyName("confirmPassword")]
    public string? ConfirmPassword { get; set; }
}
