using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;

namespace PromiseModelOnline.Api.Services.Interfaces;

public interface IEpicService
{
    Task<EpicResponse?> GetEpicByIdAsync(int id);
    Task<PagedResponse<EpicSummaryResponse>> GetEpicsByPromiseAsync(int promiseId, int pageNumber, int pageSize);
    Task<EpicResponse> CreateEpicAsync(int promiseId, CreateEpicRequest request);
    Task<EpicResponse> UpdateEpicAsync(int id, UpdateEpicRequest request);
    Task<bool> DeleteEpicAsync(int id);
}

public class CreateEpicRequest
{
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
}

public class UpdateEpicRequest
{
    public string? Statement { get; set; }
    public string? Description { get; set; }
    public string? StatusColor { get; set; }
    public int? DisplayOrder { get; set; }
}

public class EpicSummaryResponse
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string StatusColor { get; set; } = "red";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EpicResponse : EpicSummaryResponse
{
    public string? Description { get; set; }
    public int ProductPromiseId { get; set; }
    public int? OwnerId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int JourneyCount { get; set; }
}
