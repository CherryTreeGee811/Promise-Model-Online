#pragma warning disable S6964 // Models are EF Core entities, not action input DTOs
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PromiseModelOnline.Api.Models;

/// <summary>A time-boxed planning cycle within a project, containing multiple strides (sprints).</summary>
/// <remarks>
///   Iterations group strides for planning and burndown tracking. Each iteration belongs to a
///   single <see cref="Models.Project"/> and may contain multiple <see cref="Stride"/> entities.
/// </remarks>
public class Iteration
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }

    /// <summary>Display name. Required, max 200 characters.</summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Foreign key to the parent <see cref="Models.Project"/>.</summary>
    [Required]
    public int ProjectId { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>The parent project.</summary>
    [ForeignKey(nameof(ProjectId))]
    [ValidateNever]
    public Project Project { get; set; } = null!;

    /// <summary>Strides (sprints) within this iteration.</summary>
    public ICollection<Stride> Strides { get; set; } = new List<Stride>();
}
#pragma warning restore S6964
