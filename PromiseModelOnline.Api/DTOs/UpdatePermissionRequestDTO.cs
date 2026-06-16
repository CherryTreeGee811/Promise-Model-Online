using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for accepting a project invitation by updating a permission's status.</summary>
public class UpdatePermissionRequestDTO : IValidatableObject
{
    /// <summary>New status value (only <c>"Active"</c> is supported).</summary>
    public string? Status { get; set; }
    
    /// <summary>Access level (cannot be updated via this endpoint).</summary>
    public string? Level { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
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
