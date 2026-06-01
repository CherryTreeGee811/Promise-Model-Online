using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers;

[Authorize]
[Route("api/audit-events")]
public class AuditEventsController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IPromiseModelOnlineContext _context;

    public AuditEventsController(IPromiseModelOnlineContext context)
    {
        _context = context;
    }

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

        return Ok(events.Select(MapToDto));
    }

    private static int NormalizeTake(int take) => take <= 0 ? 100 : take > 500 ? 500 : take;

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

    private sealed class AuditChangeDTO
    {
        public object? Before { get; set; }

        public object? After { get; set; }
    }
}