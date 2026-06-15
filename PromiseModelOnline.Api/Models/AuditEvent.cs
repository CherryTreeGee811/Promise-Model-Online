using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.Models;

/// <summary>An immutable audit trail entry recording a change to any tracked entity.</summary>
/// <remarks>
///   Automatically created by <c>PromiseModelOnlineContext.SaveChangesAsync</c> whenever an entity
///   is inserted, updated, or deleted. Captures the actor identity, entity type, action type,
///   and JSON-serialized before/after/change snapshots for full auditability.
/// </remarks>
public class AuditEvent
{
    /// <summary>Primary key (64-bit for high-volume audit logs).</summary>
    [Key]
    public long Id { get; set; }

    /// <summary>UTC timestamp when the change occurred.</summary>
    [Required]
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Actor identifier from the JWT <c>sub</c> or <c>nameidentifier</c> claim. Max 256 characters.</summary>
    [MaxLength(256)]
    public string? ActorUserId { get; set; }

    /// <summary>Actor email address. Max 256 characters.</summary>
    [MaxLength(256)]
    public string? ActorEmail { get; set; }

    /// <summary>Actor display name. Max 256 characters.</summary>
    [MaxLength(256)]
    public string? ActorSubject { get; set; }

    /// <summary>CLR type name of the changed entity. Required, max 64 characters.</summary>
    [Required]
    [MaxLength(64)]
    public string EntityType { get; set; } = string.Empty;

    /// <summary>Primary key value of the changed entity.</summary>
    public int EntityId { get; set; }

    /// <summary>Foreign key to the root <see cref="Project"/>, if applicable.</summary>
    public int? ProjectId { get; set; }

    /// <summary>Action type string (<c>"Created"</c>, <c>"Updated"</c>, <c>"Deleted"</c>, <c>"StatusChanged"</c>). Required, max 32 characters.</summary>
    [Required]
    [MaxLength(32)]
    public string ActionType { get; set; } = string.Empty;

    /// <summary>JSON snapshot of property values before the change. <c>null</c> for new entities.</summary>
    public string? BeforeJson { get; set; }

    /// <summary>JSON snapshot of property values after the change. <c>null</c> for deleted entities.</summary>
    public string? AfterJson { get; set; }

    /// <summary>JSON dictionary of only the changed properties with before/after values.</summary>
    public string? ChangesJson { get; set; }
}
