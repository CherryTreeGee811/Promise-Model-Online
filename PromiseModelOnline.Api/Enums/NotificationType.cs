namespace PromiseModelOnline.Api.Enums;

/// <summary>Categorizes the type of a user notification.</summary>
/// <remarks>
///   Used by <c>Notification.Type</c> to determine the notification icon and behavior.
///   Each type may trigger different UI handling (e.g., <c>Invitation</c> shows accept/decline
///   actions, <c>Mention</c> links to the comment).
/// </remarks>
public enum NotificationType
{
    /// <summary>Someone commented on an entity.</summary>
    Comment,
    /// <summary>Feedback was provided on a moment.</summary>
    Feedback,
    /// <summary>Important deadline or milestone approaching.</summary>
    Deadline,
    /// <summary>User was @-mentioned in a comment.</summary>
    Mention,
    /// <summary>A stride (sprint) is ending soon.</summary>
    StrideEnding,
    /// <summary>User was invited to join a project.</summary>
    Invitation
}
