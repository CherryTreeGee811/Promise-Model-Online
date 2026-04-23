using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Contracts.Responses;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Services.Implementations;

public class MomentService : IMomentService
{
    private readonly IUnitOfWork _unitOfWork;

    public MomentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MomentResponse?> GetMomentByIdAsync(int id)
    {
        var moment = await _unitOfWork.Moments.GetByIdAsync(id);
        return moment == null ? null : MapToResponse(moment);
    }

    public async Task<PagedResponse<MomentSummaryResponse>> GetMomentsByFlowAsync(int flowId, int pageNumber, int pageSize)
    {
        var flow = await _unitOfWork.Flows.GetByIdAsync(flowId);
        if (flow == null)
            throw new InvalidOperationException($"Flow with id {flowId} not found.");

        var skip = (pageNumber - 1) * pageSize;
        var moments = await _unitOfWork.Moments.GetMomentsByFlowOrderedAsync(flowId, skip, pageSize);
        var total = await _unitOfWork.Moments.CountMomentsByFlowAsync(flowId);

        return new PagedResponse<MomentSummaryResponse>
        {
            Items = moments.Select(MapToSummary).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<PagedResponse<MomentSummaryResponse>> GetMomentsByStatusAsync(MomentStatus status, int pageNumber, int pageSize)
    {
        var skip = (pageNumber - 1) * pageSize;
        var moments = await _unitOfWork.Moments.GetMomentsByStatusAsync(status, skip, pageSize);
        var total = await _unitOfWork.Moments.CountAsync();

        return new PagedResponse<MomentSummaryResponse>
        {
            Items = moments.Select(MapToSummary).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<MomentResponse> CreateMomentAsync(int flowId, CreateMomentRequest request)
    {
        var flow = await _unitOfWork.Flows.GetByIdAsync(flowId);
        if (flow == null)
            throw new InvalidOperationException($"Flow with id {flowId} not found.");

        var moment = new Moment
        {
            Statement = request.Statement,
            Description = request.Description,
            FlowId = flowId,
            Type = request.Type,
            Status = request.Status,
            EffortEstimate = request.EffortEstimate,
            OwnerId = request.OwnerId,
            CreatedAt = DateTime.UtcNow,
            StatusColor = "red",
            DisplayOrder = 0,
            IsZombie = false
        };

        await _unitOfWork.Moments.AddAsync(moment);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponse(moment);
    }

    public async Task<MomentResponse> UpdateMomentAsync(int id, UpdateMomentRequest request)
    {
        var moment = await _unitOfWork.Moments.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Moment with id {id} not found.");

        if (!string.IsNullOrWhiteSpace(request.Statement))
            moment.Statement = request.Statement;

        if (request.Description != null)
            moment.Description = request.Description;

        if (request.Status.HasValue)
            moment.Status = request.Status.Value;

        if (request.EffortEstimate.HasValue)
            moment.EffortEstimate = request.EffortEstimate.Value;

        if (!string.IsNullOrWhiteSpace(request.StatusColor))
            moment.StatusColor = request.StatusColor;

        if (request.DisplayOrder.HasValue)
            moment.DisplayOrder = request.DisplayOrder.Value;

        moment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Moments.Update(moment);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponse(moment);
    }

    public async Task<bool> DeleteMomentAsync(int id)
    {
        var moment = await _unitOfWork.Moments.GetByIdAsync(id);
        if (moment == null)
            return false;

        _unitOfWork.Moments.Remove(moment);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompleteMomentAsync(int id)
    {
        var moment = await _unitOfWork.Moments.GetByIdAsync(id);
        if (moment == null)
            return false;

        moment.Status = MomentStatus.Done;
        moment.CompletedAt = DateTime.UtcNow;
        moment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Moments.Update(moment);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private MomentSummaryResponse MapToSummary(Moment moment)
    {
        return new MomentSummaryResponse
        {
            Id = moment.Id,
            Statement = moment.Statement,
            Type = moment.Type,
            Status = moment.Status,
            StatusColor = moment.StatusColor,
            DisplayOrder = moment.DisplayOrder,
            CreatedAt = moment.CreatedAt
        };
    }

    private MomentResponse MapToResponse(Moment moment)
    {
        return new MomentResponse
        {
            Id = moment.Id,
            Statement = moment.Statement,
            Description = moment.Description,
            Type = moment.Type,
            Status = moment.Status,
            StatusColor = moment.StatusColor,
            DisplayOrder = moment.DisplayOrder,
            FlowId = moment.FlowId,
            EffortEstimate = moment.EffortEstimate,
            OwnerId = moment.OwnerId,
            AssignedStrideId = moment.AssignedStrideId,
            CreatedAt = moment.CreatedAt,
            UpdatedAt = moment.UpdatedAt,
            CompletedAt = moment.CompletedAt,
            IsZombie = moment.IsZombie,
            TaskCount = moment.Tasks?.Count ?? 0
        };
    }
}
