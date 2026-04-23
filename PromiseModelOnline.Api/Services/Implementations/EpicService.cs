using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Services.Implementations;

public class EpicService : IEpicService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<EpicService> _logger;

    public EpicService(IUnitOfWork unitOfWork, ILogger<EpicService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<EpicResponse?> GetEpicByIdAsync(int id)
    {
        var epic = await _unitOfWork.Epics.GetByIdAsync(id);
        if (epic == null)
            return null;

        var journeyCount = await _unitOfWork.Journeys.CountJourneysByEpicAsync(id);
        return MapToResponse(epic, journeyCount);
    }

    public async Task<PagedResponse<EpicSummaryResponse>> GetEpicsByPromiseAsync(int promiseId, int pageNumber, int pageSize)
    {
        // Verify promise exists
        var promise = await _unitOfWork.Promises.GetByIdAsync(promiseId);
        if (promise == null)
            throw new KeyNotFoundException($"Promise with ID {promiseId} not found.");

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var skip = (pageNumber - 1) * pageSize;
        var epics = await _unitOfWork.Epics.GetEpicsByPromiseOrderedAsync(promiseId, skip, pageSize);
        var total = await _unitOfWork.Epics.CountEpicsByPromiseAsync(promiseId);

        return new PagedResponse<EpicSummaryResponse>
        {
            Items = epics.Select(MapToSummaryResponse).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<EpicResponse> CreateEpicAsync(int promiseId, CreateEpicRequest request)
    {
        // Verify promise exists
        var promise = await _unitOfWork.Promises.GetByIdAsync(promiseId);
        if (promise == null)
            throw new KeyNotFoundException($"Promise with ID {promiseId} not found.");

        if (string.IsNullOrWhiteSpace(request.Statement))
            throw new ArgumentException("Epic statement is required.");

        var epic = new Epic
        {
            Statement = request.Statement.Trim(),
            Description = request.Description?.Trim(),
            ProductPromiseId = promiseId,
            OwnerId = request.OwnerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            StatusColor = "red",
            DisplayOrder = 0
        };

        await _unitOfWork.Epics.AddAsync(epic);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Epic created: {EpicId} in promise {PromiseId}", epic.Id, promiseId);
        return MapToResponse(epic, 0);
    }

    public async Task<EpicResponse> UpdateEpicAsync(int id, UpdateEpicRequest request)
    {
        var epic = await _unitOfWork.Epics.GetByIdAsync(id);
        if (epic == null)
            throw new KeyNotFoundException($"Epic with ID {id} not found.");

        if (!string.IsNullOrWhiteSpace(request.Statement))
            epic.Statement = request.Statement.Trim();

        if (request.Description != null)
            epic.Description = request.Description.Trim();

        if (!string.IsNullOrWhiteSpace(request.StatusColor))
            epic.StatusColor = request.StatusColor;

        if (request.DisplayOrder.HasValue)
            epic.DisplayOrder = request.DisplayOrder.Value;

        epic.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Epics.Update(epic);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Epic updated: {EpicId}", id);
        var journeyCount = await _unitOfWork.Journeys.CountJourneysByEpicAsync(id);
        return MapToResponse(epic, journeyCount);
    }

    public async Task<bool> DeleteEpicAsync(int id)
    {
        var epic = await _unitOfWork.Epics.GetByIdAsync(id);
        if (epic == null)
            throw new KeyNotFoundException($"Epic with ID {id} not found.");

        _unitOfWork.Epics.Remove(epic);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Epic deleted: {EpicId}", id);
        return true;
    }

    private EpicSummaryResponse MapToSummaryResponse(Epic epic)
    {
        return new EpicSummaryResponse
        {
            Id = epic.Id,
            Statement = epic.Statement,
            StatusColor = epic.StatusColor,
            DisplayOrder = epic.DisplayOrder,
            CreatedAt = epic.CreatedAt
        };
    }

    private EpicResponse MapToResponse(Epic epic, int journeyCount)
    {
        return new EpicResponse
        {
            Id = epic.Id,
            Statement = epic.Statement,
            Description = epic.Description,
            ProductPromiseId = epic.ProductPromiseId,
            OwnerId = epic.OwnerId,
            StatusColor = epic.StatusColor,
            DisplayOrder = epic.DisplayOrder,
            CreatedAt = epic.CreatedAt,
            UpdatedAt = epic.UpdatedAt,
            JourneyCount = journeyCount
        };
    }
}
