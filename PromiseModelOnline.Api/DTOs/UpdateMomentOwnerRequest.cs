using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

public class UpdateMomentOwnerRequest : IValidatableObject
{
    public int? UserId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UserId is not null && UserId <= 0)
            yield return new ValidationResult(
                "UserId must be a positive integer when provided.",
                new[] { nameof(UserId) });
    }
}