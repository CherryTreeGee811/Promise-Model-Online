using CsvHelper.Configuration;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Flat export row for a single audit field change. One event with N changes produces N rows.</summary>
public class AuditEventExportRowDto
{
    /// <summary>Audit event primary key.</summary>
    public long Id { get; set; }

    /// <summary>UTC timestamp when the change occurred.</summary>
    public DateTime OccurredAtUtc { get; set; }

    /// <summary>Email of the user who performed the action.</summary>
    public string? ActorEmail { get; set; }

    /// <summary>Actor identifier from the JWT claim.</summary>
    public string? ActorUserId { get; set; }

    /// <summary>Display name of the actor.</summary>
    public string? ActorSubject { get; set; }

    /// <summary>Type of entity that was changed.</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>Primary key of the changed entity.</summary>
    public int EntityId { get; set; }

    /// <summary>Type of action performed (Created, Updated, Deleted, StatusChanged).</summary>
    public string ActionType { get; set; } = string.Empty;

    /// <summary>Human-readable summary of the change.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>Name of the field that changed, or <c>null</c> for events with no changes.</summary>
    public string? FieldName { get; set; }

    /// <summary>The value before the change, or <c>null</c> for created entities.</summary>
    public string? BeforeValue { get; set; }

    /// <summary>The value after the change, or <c>null</c> for deleted entities.</summary>
    public string? AfterValue { get; set; }
}

/// <summary>CsvHelper mapping for <see cref="AuditEventExportRowDto"/>.</summary>
public sealed class AuditEventExportRowMap : ClassMap<AuditEventExportRowDto>
{
    /// <summary>Initializes a new instance of the <see cref="AuditEventExportRowMap"/> class.</summary>
    public AuditEventExportRowMap()
    {
        Map(m => m.Id).Name("Id");
        Map(m => m.OccurredAtUtc).Name("OccurredAtUtc");
        Map(m => m.ActorEmail).Name("ActorEmail");
        Map(m => m.ActorUserId).Name("ActorUserId");
        Map(m => m.ActorSubject).Name("ActorSubject");
        Map(m => m.EntityType).Name("EntityType");
        Map(m => m.EntityId).Name("EntityId");
        Map(m => m.ActionType).Name("ActionType");
        Map(m => m.Summary).Name("Summary");
        Map(m => m.FieldName).Name("FieldName");
        Map(m => m.BeforeValue).Name("BeforeValue");
        Map(m => m.AfterValue).Name("AfterValue");
    }
}
