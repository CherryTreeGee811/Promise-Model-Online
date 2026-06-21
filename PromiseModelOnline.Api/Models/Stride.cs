#pragma warning disable S6964 // Models are EF Core entities, not action input DTOs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

/// <summary>A time-boxed sprint within an iteration, representing a work cycle with start and end dates.</summary>
/// <remarks>
///   A stride belongs to an <see cref="Iteration"/> and contains <see cref="Moment"/> assignments.
///   The deadline automation (<see cref="BusinessLogic.StrideService.SendDeadlineNotificationsAsync"/>)
///   alerts project members when a stride is ending soon.
/// </remarks>
public class Stride
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }

    /// <summary>Display name. Required, max 200 characters.</summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Foreign key to the parent <see cref="Models.Iteration"/>, or <c>null</c>.</summary>
    public int? IterationId { get; set; }

    /// <summary>Start date of the sprint.</summary>
    [Required]
    public DateTime StartDate { get; set; }

    /// <summary>End date of the sprint.</summary>
    [Required]
    public DateTime EndDate { get; set; }

    /// <summary>Duration in days. Default 14 (two-week sprint).</summary>
    public int DurationDays { get; set; } = 14;

    /// <summary>Whether this stride is currently active.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>The parent iteration.</summary>
    [ForeignKey(nameof(IterationId))]
    public Iteration? Iteration { get; set; }

    /// <summary>Moments assigned to this stride.</summary>
    public ICollection<Moment> Moments { get; set; } = new List<Moment>();
}
#pragma warning restore S6964
