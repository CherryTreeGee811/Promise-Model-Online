namespace PromiseModelOnline.Api.Enums;

/// <summary>Tracks the lifecycle state of a project permission / invitation.</summary>
/// <remarks>
///   Used by <c>Permission.Status</c>. <c>Pending</c> indicates the user has been invited but
///   has not yet accepted. <c>Active</c> means the user has accepted and has access.
/// </remarks>
public enum PermissionStatus
{
    /// <summary>Invitation sent, awaiting user acceptance.</summary>
    Pending,
    /// <summary>Invitation accepted, access is active.</summary>
    Active
}
