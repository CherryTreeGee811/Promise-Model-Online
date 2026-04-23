using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Services.Implementations;

public class FlowService : IFlowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<FlowService> _logger;

    public FlowService(IUnitOfWork unitOfWork, ILogger<FlowService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<FlowResponse?> GetFlowByIdAsync(int id)
    {
        var flow = await _unitOfWork.Flows.GetByIdAsync(id);
        if (flow == null)
            return null;

        var momentCount = await _unitOfWork.Moments.CountMomentsByFlowAsync(id);
        return MapToResponse(flow, momentCount);
    }

    public async Task<PagedResponse<FlowSummaryResponse>> GetFlowsByJourneyAsync(int journeyId, int pageNumber, int pageSize)
    {
        // Verify journey exists
        var journey = await _unitOfWork.Journeys.GetByIdAsync(journeyId);
        if (journey == null)
            throw new KeyNotFoundException($"Journey with ID {journeyId} not found.");

        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var skip = (pageNumber - 1) * pageSize;
        var flows = await _unitOfWork.Flows.GetFlowsByJourneyOrderedAsync(journeyId, skip, pageSize);
        var total = await _unitOfWork.Flows.CountFlowsByJourneyAsync(journeyId);

        return new PagedResponse<FlowSummaryResponse>
        {
            Items = flows.Select(MapToSummaryResponse).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<FlowResponse> CreateFlowAsync(int journeyId, CreateFlowRequest request)
    {
        // Verify journey exists
        var journey = await _unitOfWork.Journeys.GetByIdAsync(journeyId);
        if (journey == null)
            throw new KeyNotFoundException($"Journey with ID {journeyId} not found.");

        if (string.IsNullOrWhiteSpace(request.Statement))
            throw new ArgumentException("Flow statement is required.");

        var flow = new Flow
        {
            Statement = request.Statement.Trim(),
            Description = request.Description?.Trim(),
            JourneyId = journeyId,
            OwnerId = request.OwnerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            StatusColor = "red",
            DisplayOrder = 0
        };

        await _unitOfWork.Flows.AddAsync(flow);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Flow created: {FlowId} in journey {JourneyId}", flow.Id, journeyId);
        return MapToResponse(flow, 0);
    }

    public async Task<FlowResponse> UpdateFlowAsync(int id, UpdateFlowRequest request)
    {
        var flow = await _unitOfWork.Flows.GetByIdAsync(id);
        if (flow == null)
            throw new KeyNotFoundException($"Flow with ID {id} not found.");

        if (!string.IsNullOrWhiteSpace(request.Statement))
            flow.Statement = request.Statement.Trim();

        if (request.Description != null)
            flow.Description = request.Description.Trim();

        if (!string.IsNullOrWhiteSpace(request.StatusColor))
            flow.StatusColor = request.StatusColor;

        if (request.DisplayOrder.HasValue)
            flow.DisplayOrder = request.DisplayOrder.Value;

        flow.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Flows.Update(flow);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Flow updated: {FlowId}", id);
        var momentCount = await _unitOfWork.Moments.CountMomentsByFlowAsync(id);
        return MapToResponse(flow, momentCount);
    }

    public async Task<bool> DeleteFlowAsync(int id)
    {
        var flow = await _unitOfWork.Flows.GetByIdAsync(id);
        if (flow == null)
            throw new KeyNotFoundException($"Flow with ID {id} not found.");

        _unitOfWork.Flows.Remove(flow);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Flow deleted: {FlowId}", id);
        return true;
    }

    private FlowSummaryResponse MapToSummaryResponse(Flow flow)
    {
        return new FlowSummaryResponse
        {
            Id = flow.Id,
            Statement = flow.Statement,
            StatusColor = flow.StatusColor,
            DisplayOrder = flow.DisplayOrder,
            CreatedAt = flow.CreatedAt
        };
    }

    private FlowResponse MapToResponse(Flow flow, int momentCount)
    {
        return new FlowResponse
        {
            Id = flow.Id,
            Statement = flow.Statement,
            Description = flow.Description,
            JourneyId = flow.JourneyId,
            OwnerId = flow.OwnerId,
            StatusColor = flow.StatusColor,
            DisplayOrder = flow.DisplayOrder,
            CreatedAt = flow.CreatedAt,
            UpdatedAt = flow.UpdatedAt,
            MomentCount = momentCount
        };
    }
}
