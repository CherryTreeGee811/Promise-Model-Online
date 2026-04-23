using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;

namespace PromiseModelOnline.Api.Services.Interfaces;

public interface IJourneyService
{
    Task<JourneyResponse?> GetJourneyByIdAsync(int id);
    Task<PagedResponse<JourneySummaryResponse>> GetJourneysByEpicAsync(int epicId, int pageNumber, int pageSize);
    Task<JourneyResponse> CreateJourneyAsync(int epicId, CreateJourneyRequest request);
    Task<JourneyResponse> UpdateJourneyAsync(int id, UpdateJourneyRequest request);
    Task<bool> DeleteJourneyAsync(int id);
}

public class CreateJourneyRequest
{
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? OwnerId { get; set; }
}

public class UpdateJourneyRequest
{
    public string? Statement { get; set; }
    public string? Description { get; set; }
    public string? StatusColor { get; set; }
    public int? DisplayOrder { get; set; }
}

public class JourneySummaryResponse
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string StatusColor { get; set; } = "red";
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class JourneyResponse : JourneySummaryResponse
{
    public string? Description { get; set; }
    public int EpicId { get; set; }
    public int? OwnerId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int FlowCount { get; set; }
}
