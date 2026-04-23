using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Services.Implementations;

public class PromiseService : IPromiseService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PromiseService> _logger;

    public PromiseService(IUnitOfWork unitOfWork, ILogger<PromiseService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PromiseResponse?> GetPromiseByIdAsync(int id)
    {
        var promise = await _unitOfWork.Promises.GetByIdAsync(id);
        if (promise == null)
            return null;

        var epicCount = await _unitOfWork.Epics.CountEpicsByPromiseAsync(id);
        return MapToResponse(promise, epicCount);
    }

    public async Task<PagedResponse<PromiseSummaryResponse>> GetPromisesByProjectAsync(int projectId, int pageNumber, int pageSize)
    {
        // Verify project exists
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId);
        if (project == null)
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var skip = (pageNumber - 1) * pageSize;
        var promises = await _unitOfWork.Promises.GetPromisesByProjectOrderedAsync(projectId, skip, pageSize);
        var total = await _unitOfWork.Promises.CountPromisesByProjectAsync(projectId);

        return new PagedResponse<PromiseSummaryResponse>
        {
            Items = promises.Select(MapToSummaryResponse).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<PromiseResponse> CreatePromiseAsync(int projectId, CreatePromiseRequest request)
    {
        // Verify project exists
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId);
        if (project == null)
            throw new KeyNotFoundException($"Project with ID {projectId} not found.");

        if (string.IsNullOrWhiteSpace(request.Statement))
            throw new ArgumentException("Promise statement is required.");

        var promise = new Promise
        {
            Statement = request.Statement.Trim(),
            Description = request.Description?.Trim(),
            ProjectId = projectId,
            OwnerId = request.OwnerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            StatusColor = "red",
            DisplayOrder = 0
        };

        await _unitOfWork.Promises.AddAsync(promise);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Promise created: {PromiseId} in project {ProjectId}", promise.Id, projectId);
        return MapToResponse(promise, 0);
    }

    public async Task<PromiseResponse> UpdatePromiseAsync(int id, UpdatePromiseRequest request)
    {
        var promise = await _unitOfWork.Promises.GetByIdAsync(id);
        if (promise == null)
            throw new KeyNotFoundException($"Promise with ID {id} not found.");

        if (!string.IsNullOrWhiteSpace(request.Statement))
            promise.Statement = request.Statement.Trim();

        if (request.Description != null)
            promise.Description = request.Description.Trim();

        if (!string.IsNullOrWhiteSpace(request.StatusColor))
            promise.StatusColor = request.StatusColor;

        if (request.DisplayOrder.HasValue)
            promise.DisplayOrder = request.DisplayOrder.Value;

        promise.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Promises.Update(promise);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Promise updated: {PromiseId}", id);
        var epicCount = await _unitOfWork.Epics.CountEpicsByPromiseAsync(id);
        return MapToResponse(promise, epicCount);
    }

    public async Task<bool> DeletePromiseAsync(int id)
    {
        var promise = await _unitOfWork.Promises.GetByIdAsync(id);
        if (promise == null)
            throw new KeyNotFoundException($"Promise with ID {id} not found.");

        _unitOfWork.Promises.Remove(promise);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Promise deleted: {PromiseId}", id);
        return true;
    }

    private PromiseSummaryResponse MapToSummaryResponse(Promise promise)
    {
        return new PromiseSummaryResponse
        {
            Id = promise.Id,
            Statement = promise.Statement,
            StatusColor = promise.StatusColor,
            DisplayOrder = promise.DisplayOrder,
            CreatedAt = promise.CreatedAt
        };
    }

    private PromiseResponse MapToResponse(Promise promise, int epicCount)
    {
        return new PromiseResponse
        {
            Id = promise.Id,
            Statement = promise.Statement,
            Description = promise.Description,
            ProjectId = promise.ProjectId,
            OwnerId = promise.OwnerId,
            StatusColor = promise.StatusColor,
            DisplayOrder = promise.DisplayOrder,
            CreatedAt = promise.CreatedAt,
            UpdatedAt = promise.UpdatedAt,
            EpicCount = epicCount
        };
    }
}
