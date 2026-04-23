using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;

namespace PromiseModelOnline.Api.Services.Interfaces;

public interface IFlowService
{
    Task<FlowResponse?> GetFlowByIdAsync(int id);
    Task<PagedResponse<FlowSummaryResponse>> GetFlowsByJourneyAsync(int journeyId, int pageNumber, int pageSize);
    Task<FlowResponse> CreateFlowAsync(int journeyId, CreateFlowRequest request);
    Task<FlowResponse> UpdateFlowAsync(int id, UpdateFlowRequest request);
    Task<bool> DeleteFlowAsync(int id);
}

public class CreateFlowRequest
{
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
}

public class UpdateFlowRequest
{
    public string? Statement { get; set; }
    public string? Description { get; set; }
    public string? StatusColor { get; set; }
    public int? DisplayOrder { get; set; }
}

public class FlowSummaryResponse
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string StatusColor { get; set; } = "red";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FlowResponse : FlowSummaryResponse
{
    public string? Description { get; set; }
    public int JourneyId { get; set; }
    public int? OwnerId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int MomentCount { get; set; }
}
