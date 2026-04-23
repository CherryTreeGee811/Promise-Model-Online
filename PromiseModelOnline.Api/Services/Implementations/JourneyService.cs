using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Services.Implementations;

public class JourneyService : IJourneyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<JourneyService> _logger;

    public JourneyService(IUnitOfWork unitOfWork, ILogger<JourneyService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<JourneyResponse?> GetJourneyByIdAsync(int id)
    {
        var journey = await _unitOfWork.Journeys.GetByIdAsync(id);
        if (journey == null)
            return null;

        var flowCount = await _unitOfWork.Flows.CountFlowsByJourneyAsync(id);
        return MapToResponse(journey, flowCount);
    }

    public async Task<PagedResponse<JourneySummaryResponse>> GetJourneysByEpicAsync(int epicId, int pageNumber, int pageSize)
    {
        // Verify epic exists
        var epic = await _unitOfWork.Epics.GetByIdAsync(epicId);
        if (epic == null)
            throw new KeyNotFoundException($"Epic with ID {epicId} not found.");

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var skip = (pageNumber - 1) * pageSize;
        var journeys = await _unitOfWork.Journeys.GetJourneysByEpicOrderedAsync(epicId, skip, pageSize);
        var total = await _unitOfWork.Journeys.CountJourneysByEpicAsync(epicId);

        return new PagedResponse<JourneySummaryResponse>
        {
            Items = journeys.Select(MapToSummaryResponse).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<JourneyResponse> CreateJourneyAsync(int epicId, CreateJourneyRequest request)
    {
        // Verify epic exists
        var epic = await _unitOfWork.Epics.GetByIdAsync(epicId);
        if (epic == null)
            throw new KeyNotFoundException($"Epic with ID {epicId} not found.");

        if (string.IsNullOrWhiteSpace(request.Statement))
            throw new ArgumentException("Journey statement is required.");

        var journey = new Journey
        {
            Statement = request.Statement.Trim(),
            Description = request.Description?.Trim(),
            EpicId = epicId,
            OwnerId = request.OwnerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            StatusColor = "red",
            DisplayOrder = 0
        };

        await _unitOfWork.Journeys.AddAsync(journey);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Journey created: {JourneyId} in epic {EpicId}", journey.Id, epicId);
        return MapToResponse(journey, 0);
    }

    public async Task<JourneyResponse> UpdateJourneyAsync(int id, UpdateJourneyRequest request)
    {
        var journey = await _unitOfWork.Journeys.GetByIdAsync(id);
        if (journey == null)
            throw new KeyNotFoundException($"Journey with ID {id} not found.");

        if (!string.IsNullOrWhiteSpace(request.Statement))
            journey.Statement = request.Statement.Trim();

        if (request.Description != null)
            journey.Description = request.Description.Trim();

        if (!string.IsNullOrWhiteSpace(request.StatusColor))
            journey.StatusColor = request.StatusColor;

        if (request.DisplayOrder.HasValue)
            journey.DisplayOrder = request.DisplayOrder.Value;

        journey.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Journeys.Update(journey);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Journey updated: {JourneyId}", id);
        var flowCount = await _unitOfWork.Flows.CountFlowsByJourneyAsync(id);
        return MapToResponse(journey, flowCount);
    }

    public async Task<bool> DeleteJourneyAsync(int id)
    {
        var journey = await _unitOfWork.Journeys.GetByIdAsync(id);
        if (journey == null)
            throw new KeyNotFoundException($"Journey with ID {id} not found.");

        _unitOfWork.Journeys.Remove(journey);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Journey deleted: {JourneyId}", id);
        return true;
    }

    private JourneySummaryResponse MapToSummaryResponse(Journey journey)
    {
        return new JourneySummaryResponse
        {
            Id = journey.Id,
            Statement = journey.Statement,
            StatusColor = journey.StatusColor,
            DisplayOrder = journey.DisplayOrder,
            CreatedAt = journey.CreatedAt
        };
    }

    private JourneyResponse MapToResponse(Journey journey, int flowCount)
    {
        return new JourneyResponse
        {
            Id = journey.Id,
            Statement = journey.Statement,
            Description = journey.Description,
            EpicId = journey.EpicId,
            OwnerId = journey.OwnerId,
            StatusColor = journey.StatusColor,
            DisplayOrder = journey.DisplayOrder,
            CreatedAt = journey.CreatedAt,
            UpdatedAt = journey.UpdatedAt,
            FlowCount = flowCount
        };
    }
}
