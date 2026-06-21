using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request body for changing a moment's stride assignment.</summary>
/// <remarks>Set <see cref="StrideId"/> to <c>null</c> to move the moment back to the backlog.</remarks>
public class UpdateMomentStrideAssignmentRequest : IValidatableObject
{
    /// <summary>The stride ID to assign, or <c>null</c> to unassign.</summary>
    public int? StrideId { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StrideId is not null && StrideId <= 0)
            yield return new ValidationResult(
                "StrideId must be a positive integer when provided.",
                new[] { nameof(StrideId) });
    }
}
