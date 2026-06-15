using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for marking all notifications as read.</summary>
/// <remarks>Supports bulk update via <c>ApplyToAll</c> or targeted update via <c>NotificationIds</c>.</remarks>
public class UpdateNotificationsRequestDTO : IValidatableObject
{
    /// <summary>Whether the notification has been read by the user.</summary>
    public bool? IsRead { get; set; }

    /// <summary>When <c>true</c>, applies the change to all of the current user's notifications.</summary>
    public bool? ApplyToAll { get; set; }

    /// <summary>When provided, applies the change to the specified notification IDs.</summary>
    /// <param name="validationContext">The validation context.</param>
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
