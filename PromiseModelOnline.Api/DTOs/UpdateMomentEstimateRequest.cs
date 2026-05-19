using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

public class UpdateMomentEstimateRequest : IValidatableObject
{
    public Estimate? Estimate { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Estimate is null)
            yield return new ValidationResult(
                "Estimate is required.",
                new[] { nameof(Estimate) });
        else if (!System.Enum.IsDefined(typeof(Estimate), Estimate.Value))
            yield return new ValidationResult(
                "Estimate is not a valid value.",
                new[] { nameof(Estimate) });
    }
}