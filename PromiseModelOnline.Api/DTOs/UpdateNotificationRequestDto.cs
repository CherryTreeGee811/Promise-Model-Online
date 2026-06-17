using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for marking a single notification as read.</summary>
public class UpdateNotificationRequestDto : IValidatableObject
{
    /// <summary>Whether the notification has been read by the user.</summary>
    public bool? IsRead { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IsRead is null)
            yield return new ValidationResult(
                "At least one updatable field is required.",
                new[] { nameof(IsRead) });
        else if (IsRead != true)
            yield return new ValidationResult(
                "Only setting IsRead=true is supported.",
                new[] { nameof(IsRead) });
    }
}
