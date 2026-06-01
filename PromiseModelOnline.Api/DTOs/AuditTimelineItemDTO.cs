namespace PromiseModelOnline.Api.DTOs;

public class AuditTimelineItemDTO
{
    public long Id { get; set; }

    public DateTime OccurredAtUtc { get; set; }

    public string? ActorUserId { get; set; }

    public string? ActorEmail { get; set; }

    public string? ActorSubject { get; set; }

    public string EntityType { get; set; } = string.Empty;

    public int EntityId { get; set; }

    public int? ProjectId { get; set; }

    public string ActionType { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public IReadOnlyList<AuditFieldChangeDTO> Changes { get; set; } = [];
}