#pragma warning disable S6964 // Models are EF Core entities, not action input DTOs
﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace PromiseModelOnline.Api.Models;

/// <summary>Top-level container for a promise-model hierarchy.</summary>
/// <remarks>
///   A project owns the entire hierarchy: it contains product promises, iterations, strides,
///   and permission records. Each project is owned by a single <see cref="User"/> and is
///   publicly identified by its owner-slug + project-slug pair.
/// </remarks>
public class Project
{
    /// <summary>Primary key.</summary>
    [Key]
    [Required]
    public int Id { get; set; }
    
    /// <summary>Display name. Required, max 200 characters.</summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-safe unique slug within the owner's namespace. Required, max 200 characters.</summary>
    [Required]
    [MaxLength(200)]
    public string Slug { get; set; } = string.Empty;

    /// <summary>Optional description. Max 1000 characters.</summary>
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    /// <summary>Foreign key to the owning <see cref="User"/>.</summary>
    [Required]
    public int OwnerId { get; set; }
    
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>The owning user.</summary>
    [ForeignKey("OwnerId")]
    [ValidateNever]
    public User Owner { get; set; } = null!;

    /// <summary>Collection of user permission records for this project.</summary>
    [ValidateNever]
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();

    /// <summary>Top-level product promises, ordered by <c>DisplayOrder</c>.</summary>
    [ValidateNever]
    public ICollection<Promise> ProductPromises { get; set; } = new List<Promise>();
    
    /// <summary>Strides (sprints) belonging to iterations in this project.</summary>
    [ValidateNever]
    public ICollection<Stride> Strides { get; set; } = new List<Stride>();
}
#pragma warning restore S6964
