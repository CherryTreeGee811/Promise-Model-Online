using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

public class CreateMomentRequestDTO
{
    public string Statement { get; set; } = string.Empty;
    public int FlowId { get; set; }
    public MomentType Type { get; set; } = MomentType.Story;
    public MomentStatus Status { get; set; } = MomentStatus.Todo;
    public Estimate? EffortEstimate { get; set; }
    public int? AssignedStrideId { get; set; }
    public int DisplayOrder { get; set; }
    public string? Description { get; set; }
}