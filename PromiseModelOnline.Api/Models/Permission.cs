using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

/// <summary>Represents a user's access rights to a project.</summary>
/// <remarks>
///   A permission record links a <see cref="Models.User"/> to a <see cref="Models.Project"/> with
///   a specific <see cref="PermissionLevel"/> and lifecycle <see cref="PermissionStatus"/>.
///   <c>Pending</c> status indicates an invitation that has not yet been accepted.
/// </remarks>
public class Permission
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }

    /// <summary>Foreign key to the <see cref="Models.User"/>.</summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>Foreign key to the <see cref="Models.Project"/>.</summary>
    [Required]
    public int ProjectId { get; set; }

    /// <summary>Access level: <see cref="PermissionLevel.View"/>, <see cref="PermissionLevel.Comment"/>, or <see cref="PermissionLevel.Edit"/>.</summary>
    [Required]
    public PermissionLevel Level { get; set; } = PermissionLevel.View;

    /// <summary>Lifecycle status: <see cref="PermissionStatus.Pending"/> (invitation) or <see cref="PermissionStatus.Active"/>.</summary>
    public PermissionStatus Status { get; set; } = PermissionStatus.Pending;

    /// <summary>The user this permission applies to.</summary>
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    /// <summary>The project this permission grants access to.</summary>
    [ForeignKey("ProjectId")]
    public Project Project { get; set; } = null!;
}
