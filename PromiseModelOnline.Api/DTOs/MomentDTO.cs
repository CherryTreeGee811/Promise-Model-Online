using PromiseModelOnline.Api.Enums;
using System;

namespace PromiseModelOnline.Api.DTOs;

public class MomentDTO
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FlowId { get; set; }
    public MomentType Type { get; set; }
    public MomentStatus Status { get; set; }
    public Estimate? EffortEstimate { get; set; }
    public int? OwnerId { get; set; }
    public int? AssignedStrideId { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsZombie { get; set; }
    public int? OriginalStrideId { get; set; }
    public string StatusColor { get; set; } = "red";
}