using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating a moment's effort estimate.</summary>
public class UpdateMomentEstimateRequest : IValidatableObject
{
    /// <summary>New effort estimate, or <c>null</c> to clear.</summary>
    public Estimate? Estimate { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Estimate.HasValue && !System.Enum.IsDefined(typeof(Estimate), Estimate.Value))
            yield return new ValidationResult(
                "Estimate is not a valid value.",
                new[] { nameof(Estimate) });
    }
}
