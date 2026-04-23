using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;

namespace PromiseModelOnline.Api.Services.Interfaces;

public interface IPromiseService
{
    Task<PromiseResponse?> GetPromiseByIdAsync(int id);
    Task<PagedResponse<PromiseSummaryResponse>> GetPromisesByProjectAsync(int projectId, int pageNumber, int pageSize);
    Task<PromiseResponse> CreatePromiseAsync(int projectId, CreatePromiseRequest request);
    Task<PromiseResponse> UpdatePromiseAsync(int id, UpdatePromiseRequest request);
    Task<bool> DeletePromiseAsync(int id);
}

public class CreatePromiseRequest
{
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
}

public class UpdatePromiseRequest
{
    public string? Statement { get; set; }
    public string? Description { get; set; }
    public string? StatusColor { get; set; }
    public int? DisplayOrder { get; set; }
}

public class PromiseSummaryResponse
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string StatusColor { get; set; } = "red";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PromiseResponse : PromiseSummaryResponse
{
    public string? Description { get; set; }
    public int ProjectId { get; set; }
    public int? OwnerId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int EpicCount { get; set; }
}
