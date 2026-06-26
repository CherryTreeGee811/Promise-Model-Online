using System.Text.Json.Serialization;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

public class UpdateMomentRequestDto
{
    [JsonRequired]
    public int Id { get; set; }
    [JsonRequired]
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    [JsonRequired]
    public int FlowId { get; set; }
    [JsonRequired]
    public MomentType Type { get; set; }
    [JsonRequired]
    public MomentStatus Status { get; set; }
    public Estimate? EffortEstimate { get; set; }
    [JsonRequired]
    public int SequenceNumber { get; set; }
    [JsonRequired]
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public int? OwnerId { get; set; }
    public int? AssignedStrideId { get; set; }
}
