using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating a moment's owner assignment.</summary>
public class UpdateMomentOwnerRequest : IValidatableObject
{
    /// <summary>Foreign key to the user.</summary>
    /// <param name="validationContext">The validation context.</param>
    public int? UserId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (UserId is not null && UserId <= 0)
            yield return new ValidationResult(
                "UserId must be a positive integer when provided.",
                new[] { nameof(UserId) });
    }
}