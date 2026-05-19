using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Partial update payload for a user's notification collection.
/// Currently supports setting all notifications to read.
/// </summary>
public class UpdateNotificationsRequestDTO : IValidatableObject
{
    public bool? IsRead { get; set; }

    /// <summary>
    /// When true, applies the change to all of the current user's notifications.
    /// </summary>
    public bool? ApplyToAll { get; set; }

    /// <summary>
    /// When provided, applies the change to the specified notification ids.
    /// Use this instead of ApplyToAll for targeted bulk updates.
    /// </summary>
    public int[]? NotificationIds { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IsRead is null)
            yield return new ValidationResult(
                "At least one updatable field is required.",
                new[] { nameof(IsRead) });
        else if (IsRead != true)
            yield return new ValidationResult(
                "Only setting IsRead=true is supported.",
                new[] { nameof(IsRead) });

        if (ApplyToAll == true && NotificationIds is not null)
            yield return new ValidationResult(
                "Cannot specify both ApplyToAll and NotificationIds",
                new[] { nameof(ApplyToAll), nameof(NotificationIds) });

        if (ApplyToAll != true && (NotificationIds is null || NotificationIds.Length == 0))
            yield return new ValidationResult(
                "Must provide NotificationIds if not applying to all",
                new[] { nameof(NotificationIds) });

        if (NotificationIds is not null && NotificationIds.Any(id => id <= 0))
            yield return new ValidationResult(
                "NotificationIds must contain only positive integers.",
                new[] { nameof(NotificationIds) });
    }
}
