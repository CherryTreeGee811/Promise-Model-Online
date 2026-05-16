using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Partial update payload for a stride.
/// </summary>
public class UpdateStrideRequestDTO : IValidatableObject
{
    /// <summary>
    /// When true, progresses the stride by moving unfinished moments to the next stride.
    /// </summary>
    public bool? ProgressUnfinishedMoments { get; set; }

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
