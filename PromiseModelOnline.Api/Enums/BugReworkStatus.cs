namespace PromiseModelOnline.Api.Enums;

/// <summary>Tracks the state of a bug or rework task attached to a moment.</summary>
/// <remarks>
///   Used by <c>BugReworkTask.Status</c> to track the lifecycle of defect and rework items.
/// </remarks>
public enum BugReworkStatus
{
    /// <summary>Reported but not yet addressed.</summary>
    Open,
    /// <summary>Actively being worked on.</summary>
    InProgress,
    /// <summary>Fix has been applied and verified.</summary>
    Resolved,
    /// <summary>Closed after final review.</summary>
    Closed
}
