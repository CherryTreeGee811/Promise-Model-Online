namespace PromiseModelOnline.Api.Enums;

/// <summary>Defines the level of access a user has to a project.</summary>
/// <remarks>
///   Used by <c>Permission.Level</c> to control what operations a user can perform.
///   <c>View</c> = read-only, <c>Comment</c> = read + comment, <c>Edit</c> = full edit access.
/// </remarks>
public enum PermissionLevel
{
    /// <summary>Read-only access to view the project and its entities.</summary>
    View,
    /// <summary>Can view and add comments, but cannot edit entities.</summary>
    Comment,
    /// <summary>Full read/write access to create, edit, and delete entities.</summary>
    Edit
}
