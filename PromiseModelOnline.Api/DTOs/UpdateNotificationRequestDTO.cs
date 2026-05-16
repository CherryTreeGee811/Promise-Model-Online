using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Partial update payload for a single notification.
/// </summary>
public class UpdateNotificationRequestDTO : IValidatableObject
{
    public bool? IsRead { get; set; }

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
