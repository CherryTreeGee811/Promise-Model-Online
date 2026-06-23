using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for updating a reaction's emote.</summary>
public class UpdateReactionRequestDto : IValidatableObject
{
    /// <summary>Emoji reaction string.</summary>
    public string? Emote { get; set; }

    /// <summary>Validates the request data.</summary>
    /// <param name="validationContext">The validation context.</param>
    /// <returns>Validation errors, if any.</returns>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Emote))
            yield return new ValidationResult(
                "Emote is required.",
                new[] { nameof(Emote) });
    }
}
