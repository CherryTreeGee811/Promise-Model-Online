using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for completing a stride and progressing unfinished moments.</summary>
public class UpdateStrideRequestDto : IValidatableObject
{
    /// <summary>
    /// When true, progresses the stride by moving unfinished moments to the next stride.
    /// </summary>
    public bool? ProgressUnfinishedMoments { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ProgressUnfinishedMoments is null)
            yield return new ValidationResult(
                "At least one updatable field is required.",
                new[] { nameof(ProgressUnfinishedMoments) });
        else if (ProgressUnfinishedMoments != true)
            yield return new ValidationResult(
                "Only setting ProgressUnfinishedMoments=true is supported.",
                new[] { nameof(ProgressUnfinishedMoments) });
    }
}
