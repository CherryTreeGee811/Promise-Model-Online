namespace PromiseModelOnline.Api.Enums;

/// <summary>Defines the system-level role assigned to a user account.</summary>
/// <remarks>
///   Used by <c>User.Role</c> to differentiate user types. <c>Student</c> and <c>Professor</c>
///   indicate academic users, while <c>Professional</c> is the default for standard accounts.
/// </remarks>
public enum UserRole
{
    /// <summary>Student account (academic context).</summary>
    Student,
    /// <summary>Professor / educator account (academic context).</summary>
    Professor,
    /// <summary>Professional account (default for SSO/OAuth sign-up).</summary>
    Professional
}
