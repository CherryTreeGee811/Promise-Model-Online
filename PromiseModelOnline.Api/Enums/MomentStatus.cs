namespace PromiseModelOnline.Api.Enums;

/// <summary>Defines the workflow status of a moment (task item).</summary>
/// <remarks>
///   Used by <c>Moment.Status</c> and <c>StatusColorRules</c> to determine display color
///   and hierarchy roll-up behavior. Drives burndown calculations and hierarchy status propagation.
/// </remarks>
public enum MomentStatus
{
    /// <summary>Not yet started. Display color: red.</summary>
    Todo,
    /// <summary>Actively being worked on. Display color: orange.</summary>
    InProgress,
    /// <summary>Work is blocked by a dependency or issue. Display color: black.</summary>
    Blocked,
    /// <summary>Work is complete. Display color: green.</summary>
    Done
}
