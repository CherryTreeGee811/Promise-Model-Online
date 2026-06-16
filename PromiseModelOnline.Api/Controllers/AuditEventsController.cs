using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>REST controller for audit event queries.</summary>
/// <remarks>
///   Retrieves project-level and entity-level audit history with pagination, change summary
///   generation, and <c>X-Total-Count</c> response headers for client-side pagination.
///   Requires the <c>projects.read</c> authorization policy.
/// </remarks>
[Route("api/audit-events")]
[Authorize(Policy = "projects.read")]
public class AuditEventsController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
        /// <param name="context">The database context.</param>

    private readonly IPromiseModelOnlineContext _context;
    private readonly ILogger<AuditEventsController> _logger;

    /// <summary>Initializes the controller with the database context.</summary>
    /// <param name="context">The database context.</param>
    /// <param name="logger">The logger for audit and error events.</param>
    public AuditEventsController(IPromiseModelOnlineContext context, ILogger<AuditEventsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Retrieve paginated audit history for a project.</summary>
    /// <param name="projectId">The project ID to query.</param>
    /// <param name="take">Maximum results to return (default 100, max 500).</param>
    /// <param name="skip">Number of results to skip for pagination.</param>
    /// <response code="200">Returns the paginated audit timeline items. <c>X-Total-Count</c> header contains the total.</response>
    /// <returns>A paginated list of audit timeline DTOs.</returns>
    [HttpGet("projects/{projectId:int}")]
    public async Task<ActionResult<IEnumerable<AuditTimelineItemDTO>>> GetProjectHistory(
        int projectId,
        [FromQuery] int take = 100,
        [FromQuery] int skip = 0)
    {
        var normalizedTake = NormalizeTake(take);

        var query = _context.AuditEvents
            .Where(entry => entry.ProjectId == projectId)
            .OrderByDescending(entry => entry.OccurredAtUtc)
            .ThenByDescending(entry => entry.Id);

        Response.Headers["X-Total-Count"] = query.Count().ToString();

        var events = query
            .Skip(skip)
            .Take(normalizedTake)
            .ToList();

        return Ok(events.Select(MapToDto));
    }

    /// <summary>Retrieve paginated audit history for a specific entity.</summary>
    /// <param name="entityType">The entity type name (e.g., <c>"Moment"</c>, <c>"Project"</c>).</param>
    /// <param name="entityId">The entity's primary key.</param>
    /// <param name="take">Maximum results to return (default 100, max 500).</param>
    /// <param name="skip">Number of results to skip for pagination.</param>
    /// <response code="200">Returns the paginated audit timeline items for the entity.</response>
    /// <returns>A paginated list of audit timeline DTOs.</returns>
    [HttpGet("entities/{entityType}/{entityId:int}")]
    public async Task<ActionResult<IEnumerable<AuditTimelineItemDTO>>> GetEntityHistory(
        string entityType,
        int entityId,
        [FromQuery] int take = 100,
        [FromQuery] int skip = 0)
    {
        var normalizedTake = NormalizeTake(take);

        var query = _context.AuditEvents
            .Where(entry => entry.EntityType == entityType && entry.EntityId == entityId)
            .OrderByDescending(entry => entry.OccurredAtUtc)
            .ThenByDescending(entry => entry.Id);

        Response.Headers["X-Total-Count"] = query.Count().ToString();

        var events = query
            .Skip(skip)
            .Take(normalizedTake)
            .ToList();

        /// <param name="take">The value to normalize.</param>
        return Ok(events.Select(MapToDto));
    }

    /// <summary>Clamp the <c>take</c> parameter to a valid range [1, 500].</summary>
    /// <returns>The clamped take value.</returns>
    private static int NormalizeTake(int take) => take <= 0 ? 100 : take > 500 ? 500 : take;
        /// <param name="auditEvent">The audit event.</param>

    /// <summary>Map an <see cref="AuditEvent"/> entity to a <see cref="AuditTimelineItemDTO"/>.</summary>
    private static AuditTimelineItemDTO MapToDto(AuditEvent auditEvent)
    {
        var changes = DeserializeChanges(auditEvent.ChangesJson);

        return new AuditTimelineItemDTO
        {
            Id = auditEvent.Id,
            OccurredAtUtc = auditEvent.OccurredAtUtc,
            ActorUserId = auditEvent.ActorUserId,
            ActorEmail = auditEvent.ActorEmail,
            ActorSubject = auditEvent.ActorSubject,
            EntityType = auditEvent.EntityType,
            EntityId = auditEvent.EntityId,
            ProjectId = auditEvent.ProjectId,
            ActionType = auditEvent.ActionType,
            Summary = BuildSummary(auditEvent, changes),
            Changes = changes
        };
    }
        /// <param name="changesJson">The JSON string containing the changes.</param>

    /// <summary>Deserialize the JSON changes dictionary into a list of <see cref="AuditFieldChangeDTO"/>.</summary>
    /// <returns>A list of field change DTOs.</returns>
    private static IReadOnlyList<AuditFieldChangeDTO> DeserializeChanges(string? changesJson)
    {
        if (string.IsNullOrWhiteSpace(changesJson))
            return [];

        var changes = JsonSerializer.Deserialize<Dictionary<string, AuditChangeDTO>>(changesJson, JsonOptions);
        if (changes is null || changes.Count == 0)
            return [];

        return changes
            .Select(entry => new AuditFieldChangeDTO
            {
                FieldName = entry.Key,
                Before = entry.Value.Before,
                After = entry.Value.After
            })
            .ToList();
    }
        /// <param name="auditEvent">The audit event.</param>
        /// <param name="changes">The list of field changes.</param>

    /// <summary>Build a human-readable summary string from an audit event and its changes.</summary>
    /// <returns>A human-readable summary string.</returns>
    private static string BuildSummary(AuditEvent auditEvent, IReadOnlyList<AuditFieldChangeDTO> changes)
    {
        if (string.Equals(auditEvent.ActionType, nameof(PromiseModelOnline.Api.Enums.AuditActionType.Created), System.StringComparison.OrdinalIgnoreCase))
        {
            return $"Created {auditEvent.EntityType}";
        }

        if (string.Equals(auditEvent.ActionType, nameof(PromiseModelOnline.Api.Enums.AuditActionType.Deleted), System.StringComparison.OrdinalIgnoreCase))
        {
            return $"Deleted {auditEvent.EntityType}";
        }

        if (string.Equals(auditEvent.ActionType, nameof(PromiseModelOnline.Api.Enums.AuditActionType.StatusChanged), System.StringComparison.OrdinalIgnoreCase))
        {
            var statusChange = changes.FirstOrDefault(change => string.Equals(change.FieldName, "Status", System.StringComparison.OrdinalIgnoreCase));
            if (statusChange is not null)
            {
                return $"Changed status from {FormatValue(statusChange.Before)} to {FormatValue(statusChange.After)}";
            }
        }

        if (changes.Count == 0)
            return $"Updated {auditEvent.EntityType}";

        var fields = string.Join(", ", changes.Select(change => change.FieldName));
        return $"Updated {auditEvent.EntityType}: {fields}";
    }
        /// <param name="value">The value to format.</param>

    /// <summary>Format a value for display in the audit summary.</summary>
    private static string FormatValue(object? value)
    {
        return value switch
        {
            null => "blank",
            JsonElement element when element.ValueKind == JsonValueKind.Null => "blank",
            JsonElement element when element.ValueKind == JsonValueKind.String => element.GetString() ?? "blank",
            JsonElement element when element.ValueKind == JsonValueKind.Number => element.ToString(),
            JsonElement element when element.ValueKind == JsonValueKind.True => "true",
            JsonElement element when element.ValueKind == JsonValueKind.False => "false",
            JsonElement element => element.ToString(),
            _ => value.ToString() ?? "blank"
        };
    }

    /// <summary>Internal DTO for deserializing individual field changes from JSON.</summary>
    private sealed class AuditChangeDTO
    {
        public object? Before { get; set; }

        public object? After { get; set; }
    }
}
