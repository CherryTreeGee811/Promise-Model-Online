using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Partial update payload for a reaction.
/// </summary>
public class UpdateReactionRequestDTO : IValidatableObject
{
    public string? Emote { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Emote))
            yield return new ValidationResult(
                "Emote is required.",
                new[] { nameof(Emote) });
    }
}
