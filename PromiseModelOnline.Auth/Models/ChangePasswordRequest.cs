using System.Text.Json.Serialization;

namespace PromiseModelOnline.Auth.Models;

/// <summary>Request body for changing a user's password.</summary>
public class ChangePasswordRequest
{
    /// <summary>The user's current password for verification.</summary>
    [JsonPropertyName("currentPassword")]
    public string? CurrentPassword { get; set; }

    /// <summary>The desired new password.</summary>
    [JsonPropertyName("newPassword")]
    public string? NewPassword { get; set; }

    /// <summary>Confirmation of the new password (must match <see cref="NewPassword"/>).</summary>
    [JsonPropertyName("confirmPassword")]
    public string? ConfirmPassword { get; set; }
}
