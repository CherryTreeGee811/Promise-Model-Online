using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Partial update payload for a permission invitation (e.g., accept an invite).
/// </summary>
public class UpdatePermissionRequestDTO : IValidatableObject
{
    public string? Status { get; set; }
    public string? Level { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Status))
            yield return new ValidationResult(
                "Status is required.",
                new[] { nameof(Status) });

        if (!string.IsNullOrWhiteSpace(Level))
            yield return new ValidationResult(
                "Level cannot be updated via this endpoint.",
                new[] { nameof(Level) });

        var normalizedStatus = Status?.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedStatus)
            && !string.Equals(normalizedStatus, "Active", System.StringComparison.OrdinalIgnoreCase))
            yield return new ValidationResult(
                "Only Status='Active' is supported.",
                new[] { nameof(Status) });
    }
}
