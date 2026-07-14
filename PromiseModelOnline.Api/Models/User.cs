#pragma warning disable S6964 // Models are EF Core entities, not action input DTOs
using System.ComponentModel.DataAnnotations;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

/// <summary>Represents a registered user in the system.</summary>
/// <remarks>
///   Users are auto-provisioned via SSO/OAuth login flows and may own projects, be assigned as
///   moment owners, receive notifications, leave comments, and hold permissions on projects.
///   Each user has a unique <see cref="Slug"/> used in URLs.
/// </remarks>
public class User
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }

    /// <summary>Email address. Required, validated format, max 256 characters.</summary>
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    /// <summary>Display name. Required, max 100 characters.</summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Auth system username (IdentityUser.UserName). Populated from JWT name claim on each login. Null for legacy users until their next API call.</summary>
    [MaxLength(256)]
    public string? Username { get; set; }

    /// <summary>URL-safe unique slug. Required, max 100 characters.</summary>
    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    /// <summary>System role. Defaults to <see cref="UserRole.Student"/>.</summary>
    [Required]
    public UserRole Role { get; set; } = UserRole.Student;

    /// <summary>UTC timestamp of account creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UTC timestamp of last login, or <c>null</c>.</summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>Projects where this user is the owner.</summary>
    public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();

    /// <summary>Permission records granting access to projects.</summary>
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();

    /// <summary>Comments authored by this user.</summary>
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    /// <summary>Notifications addressed to this user.</summary>
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    /// <summary>Moment assignments for this user.</summary>
    public ICollection<MomentAssignment> MomentAssignments { get; set; } = new List<MomentAssignment>();
}
#pragma warning restore S6964
