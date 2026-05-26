using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.Models;

public class ChangePasswordRequest : IValidatableObject
{
    [JsonPropertyName("currentPassword")]
    public string CurrentPassword { get; set; } = string.Empty;

    [JsonPropertyName("newPassword")]
    public string NewPassword { get; set; } = string.Empty;

    [JsonPropertyName("confirmPassword")]
    public string ConfirmPassword { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(CurrentPassword))
            yield return new ValidationResult(
                "CurrentPassword is required.",
                new[] { nameof(CurrentPassword) });

        if (string.IsNullOrWhiteSpace(NewPassword))
            yield return new ValidationResult(
                "NewPassword is required.",
                new[] { nameof(NewPassword) });

        if (string.IsNullOrWhiteSpace(ConfirmPassword))
            yield return new ValidationResult(
                "ConfirmPassword is required.",
                new[] { nameof(ConfirmPassword) });

        if (!string.IsNullOrWhiteSpace(NewPassword)
            && !string.IsNullOrWhiteSpace(ConfirmPassword)
            && !string.Equals(NewPassword, ConfirmPassword, System.StringComparison.Ordinal))
            yield return new ValidationResult(
                "NewPassword and ConfirmPassword must match.",
                new[] { nameof(NewPassword), nameof(ConfirmPassword) });
    }
}
