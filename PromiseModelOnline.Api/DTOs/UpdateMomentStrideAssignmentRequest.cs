using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Request body for changing a moment's stride assignment.
/// Set <see cref="StrideId"/> to null to move the moment back to the backlog.
/// </summary>
public class UpdateMomentStrideAssignmentRequest : IValidatableObject
{
    public int? StrideId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StrideId is not null && StrideId <= 0)
            yield return new ValidationResult(
                "StrideId must be a positive integer when provided.",
                new[] { nameof(StrideId) });
    }
}