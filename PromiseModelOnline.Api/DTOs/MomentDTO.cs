using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Moment"/> responses with sub-tasks and lineage metadata.</summary>
public class MomentDTO
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
    /// <summary>Foreign key to the parent <see cref="Models.Flow"/>.</summary>
    public int FlowId { get; set; }
    /// <summary>Entity type discriminator.</summary>
    public MomentType Type { get; set; }
    /// <summary>Current workflow status.</summary>
    public MomentStatus Status { get; set; }
    /// <summary>Effort estimate using Fibonacci sizing, or <c>null</c>.</summary>
    public Estimate? EffortEstimate { get; set; }
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }
    /// <summary>Foreign key to the assigned <see cref="Models.Stride"/>, or <c>null</c>.</summary>
    public int? AssignedStrideId { get; set; }
    /// <summary>Human-readable sequence number within the parent scope.</summary>
    public int SequenceNumber { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }
    /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
    public DateTime? CompletedAt { get; set; }
    /// <summary>Indicates this entity was migrated from a previous stride.</summary>
    public bool IsZombie { get; set; }
    /// <summary>The stride this entity was originally assigned to before migration.</summary>
    public int? OriginalStrideId { get; set; }
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";
    /// <summary>Child task DTOs.</summary>
    public List<MomentTaskDTO> Tasks { get; set; } = new List<MomentTaskDTO>();
    /// <summary>Slug of the owner user.</summary>
    public string? OwnerSlug { get; set; }
    /// <summary>Slug of the project.</summary>
    public string? ProjectSlug { get; set; }
}
