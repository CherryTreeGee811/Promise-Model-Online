using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Request body for changing a moment's status.
/// </summary>
public class UpdateMomentStatusRequest : IValidatableObject
{
    public MomentStatus NewStatus { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!System.Enum.IsDefined(typeof(MomentStatus), NewStatus))
            yield return new ValidationResult(
                "NewStatus is not a valid MomentStatus value.",
                new[] { nameof(NewStatus) });
    }
}