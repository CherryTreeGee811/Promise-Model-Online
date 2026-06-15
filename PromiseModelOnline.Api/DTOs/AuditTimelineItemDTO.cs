namespace PromiseModelOnline.Api.DTOs;

/// <summary>An audit event entry displayed on the project timeline.</summary>
public class AuditTimelineItemDTO
{
    /// <summary>Primary key (64-bit).</summary>
    public long Id { get; set; }

    /// <summary>UTC timestamp when the change occurred.</summary>
    public DateTime OccurredAtUtc { get; set; }

    /// <summary>Actor identifier from the JWT claim.</summary>
    public string? ActorUserId { get; set; }

    /// <summary>Email of the user who performed the action.</summary>
    public string? ActorEmail { get; set; }

    /// <summary>Display name of the user who performed the action.</summary>
    public string? ActorSubject { get; set; }

    /// <summary>Type of entity that was changed.</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>Primary key of the changed entity.</summary>
    public int EntityId { get; set; }

    /// <summary>ID of the project the entity belongs to.</summary>
    public int? ProjectId { get; set; }

    /// <summary>Type of action performed (Created, Updated, Deleted, StatusChanged).</summary>
    public string ActionType { get; set; } = string.Empty;

    /// <summary>Human-readable summary of the change.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>List of individual field changes, if available.</summary>
    public IReadOnlyList<AuditFieldChangeDTO> Changes { get; set; } = [];
}
