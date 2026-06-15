namespace PromiseModelOnline.Api.Enums;

/// <summary>Classifies a moment as a story (feature) or a job (operational task).</summary>
/// <remarks>
///   Used to distinguish between feature work and operational/maintenance tasks when displaying
///   and filtering moments in the UI.
/// </remarks>
public enum MomentType
{
    /// <summary>A feature or user story.</summary>
    Story,
    /// <summary>An operational or maintenance task.</summary>
    Job
}
