using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Request body for changing a moment's type.
/// </summary>
public class UpdateMomentTypeRequest : IValidatableObject
{
    public MomentType NewType { get; set; }

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