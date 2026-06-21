using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>Links a <see cref="Models.User"/> to a <see cref="Models.Moment"/> with an optional role.</summary>
/// <remarks>
///   Provides a many-to-many relationship between users and moments, allowing multiple users
///   to be associated with a single moment in different roles (e.g., reviewer, contributor).
/// </remarks>
public class MomentAssignment
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }

    /// <summary>Foreign key to the <see cref="Models.Moment"/>.</summary>
    public int MomentId { get; set; }

    /// <summary>Foreign key to the <see cref="Models.User"/>.</summary>
    public int UserId { get; set; }

    /// <summary>Optional role descriptor (e.g., <c>"Reviewer"</c>, <c>"Contributor"</c>). Max 50 characters.</summary>
    [MaxLength(50)]
    public string? Role { get; set; }

    /// <summary>The assigned moment.</summary>
    [ForeignKey("MomentId")]
    public Moment Moment { get; set; } = null!;

    /// <summary>The assigned user.</summary>
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
