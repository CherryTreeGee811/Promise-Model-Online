using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;

namespace PromiseModelOnline.Api.Services.Interfaces;

public interface IProjectService
{
    Task<ProjectResponse?> GetProjectByIdAsync(int id);
    Task<PagedResponse<ProjectSummaryResponse>> GetProjectsAsync(int pageNumber, int pageSize);
    Task<PagedResponse<ProjectSummaryResponse>> GetProjectsByOwnerAsync(int ownerId, int pageNumber, int pageSize);
    Task<ProjectResponse> CreateProjectAsync(CreateProjectRequest request);
    Task<ProjectResponse> UpdateProjectAsync(int id, UpdateProjectRequest request);
    Task<bool> DeleteProjectAsync(int id);
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OwnerId { get; set; }
}

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class ProjectSummaryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ProjectResponse : ProjectSummaryResponse
{
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public int PromiseCount { get; set; }
}
