using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Services.Interfaces;

public interface IMomentService
{
    Task<MomentResponse?> GetMomentByIdAsync(int id);
    Task<PagedResponse<MomentSummaryResponse>> GetMomentsByFlowAsync(int flowId, int pageNumber, int pageSize);
    Task<PagedResponse<MomentSummaryResponse>> GetMomentsByStatusAsync(MomentStatus status, int pageNumber, int pageSize);
    Task<MomentResponse> CreateMomentAsync(int flowId, CreateMomentRequest request);
    Task<MomentResponse> UpdateMomentAsync(int id, UpdateMomentRequest request);
    Task<bool> DeleteMomentAsync(int id);
    Task<bool> CompleteMomentAsync(int id);
}

public class CreateMomentRequest
{
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MomentType Type { get; set; } = MomentType.Story;
    public MomentStatus Status { get; set; } = MomentStatus.Todo;
    public Estimate? EffortEstimate { get; set; }
    public int? OwnerId { get; set; }
}

public class UpdateMomentRequest
{
    public string? Statement { get; set; }
    public string? Description { get; set; }
    public MomentStatus? Status { get; set; }
    public Estimate? EffortEstimate { get; set; }
    public string? StatusColor { get; set; }
    public int? DisplayOrder { get; set; }
}

public class MomentSummaryResponse
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public MomentType Type { get; set; } = MomentType.Story;
    public MomentStatus Status { get; set; } = MomentStatus.Todo;
    public string StatusColor { get; set; } = "red";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MomentResponse : MomentSummaryResponse
{
    public string? Description { get; set; }
    public int FlowId { get; set; }
    public Estimate? EffortEstimate { get; set; }
    public int? OwnerId { get; set; }
    public int? AssignedStrideId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsZombie { get; set; }
    public int TaskCount { get; set; }
}
