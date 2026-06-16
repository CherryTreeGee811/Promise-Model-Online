using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating a moment's type classification.</summary>
public class UpdateMomentTypeRequest : IValidatableObject
{
    /// <summary>The new type value to apply.</summary>
    [Required]
    public MomentType NewType { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!System.Enum.IsDefined(typeof(MomentType), NewType))
        {
            yield return new ValidationResult(
                "NewType is not a valid MomentType value.",
                new[] { nameof(NewType) });
        }
    }
}
