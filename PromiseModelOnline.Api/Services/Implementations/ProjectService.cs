using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Services.Implementations;

public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ProjectService> _logger;

    public ProjectService(IUnitOfWork unitOfWork, ILogger<ProjectService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ProjectResponse?> GetProjectByIdAsync(int id)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id);
        if (project == null)
            return null;

        var promiseCount = await _unitOfWork.Promises.CountPromisesByProjectAsync(id);
        return MapToResponse(project, promiseCount);
    }

    public async Task<PagedResponse<ProjectSummaryResponse>> GetProjectsAsync(int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var skip = (pageNumber - 1) * pageSize;
        var projects = await _unitOfWork.Projects.GetAllAsync(skip, pageSize);
        var total = await _unitOfWork.Projects.CountAsync();

        return new PagedResponse<ProjectSummaryResponse>
        {
            Items = projects.Select(MapToSummaryResponse).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<PagedResponse<ProjectSummaryResponse>> GetProjectsByOwnerAsync(int ownerId, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var skip = (pageNumber - 1) * pageSize;
        var projects = await _unitOfWork.Projects.GetProjectsByOwnerAsync(ownerId, skip, pageSize);
        var total = await _unitOfWork.Projects.CountProjectsByOwnerAsync(ownerId);

        return new PagedResponse<ProjectSummaryResponse>
        {
            Items = projects.Select(MapToSummaryResponse).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<ProjectResponse> CreateProjectAsync(CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Project name is required.");

        var project = new Project
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            OwnerId = request.OwnerId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Projects.AddAsync(project);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Project created: {ProjectId}", project.Id);
        return MapToResponse(project, 0);
    }

    public async Task<ProjectResponse> UpdateProjectAsync(int id, UpdateProjectRequest request)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id);
        if (project == null)
            throw new KeyNotFoundException($"Project with ID {id} not found.");

        if (!string.IsNullOrWhiteSpace(request.Name))
            project.Name = request.Name.Trim();

        if (request.Description != null)
            project.Description = request.Description.Trim();

        _unitOfWork.Projects.Update(project);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Project updated: {ProjectId}", id);
        var promiseCount = await _unitOfWork.Promises.CountPromisesByProjectAsync(id);
        return MapToResponse(project, promiseCount);
    }

    public async Task<bool> DeleteProjectAsync(int id)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(id);
        if (project == null)
            throw new KeyNotFoundException($"Project with ID {id} not found.");

        _unitOfWork.Projects.Remove(project);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Project deleted: {ProjectId}", id);
        return true;
    }

    private ProjectSummaryResponse MapToSummaryResponse(Project project)
    {
        return new ProjectSummaryResponse
        {
            Id = project.Id,
            Name = project.Name,
            CreatedAt = project.CreatedAt
        };
    }

    private ProjectResponse MapToResponse(Project project, int promiseCount)
    {
        return new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            OwnerId = project.OwnerId,
            CreatedAt = project.CreatedAt,
            PromiseCount = promiseCount
        };
    }
}
