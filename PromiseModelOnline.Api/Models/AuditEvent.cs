using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.Models;

public class AuditEvent
{
    [Key]
    public long Id { get; set; }

    [Required]
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(256)]
    public string? ActorUserId { get; set; }

    [MaxLength(256)]
    public string? ActorEmail { get; set; }

    [MaxLength(256)]
    public string? ActorSubject { get; set; }

    [Required]
    [MaxLength(64)]
    public string EntityType { get; set; } = string.Empty;

    public int EntityId { get; set; }

    public int? ProjectId { get; set; }

    [Required]
    [MaxLength(32)]
    public string ActionType { get; set; } = string.Empty;

    public string? BeforeJson { get; set; }

    public string? AfterJson { get; set; }

    public string? ChangesJson { get; set; }
}