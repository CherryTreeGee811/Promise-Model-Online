using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Aggregates child statuses upward through the hierarchy.</summary>
/// <remarks>
///   When a moment's status changes, this service recalculates the aggregated status of its
///   parent entities (flow, journey, epic, promise) based on the statuses of their children.
///   Walks the hierarchy recursively from the point of change to the root. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the service with all hierarchy repositories.</remarks>
/// <param name="promiseRepository">Repository for promise data access.</param>
/// <param name="epicRepository">Repository for epic data access.</param>
/// <param name="journeyRepository">Repository for journey data access.</param>
/// <param name="flowRepository">Repository for flow data access.</param>
/// <param name="momentRepository">Repository for moment data access.</param>
public class HierarchyStatusService(
    IGenericRepository<Promise> promiseRepository,
    IEpicRepository epicRepository,
    IJourneyRepository journeyRepository,
    IFlowRepository flowRepository,
    IMomentRepository momentRepository) : IHierarchyStatusService
{
    private readonly IGenericRepository<Promise> _promiseRepository = promiseRepository;
    private readonly IEpicRepository _epicRepository = epicRepository;
    private readonly IJourneyRepository _journeyRepository = journeyRepository;
    private readonly IFlowRepository _flowRepository = flowRepository;
    private readonly IMomentRepository _momentRepository = momentRepository;

    /// <summary>Recalculate status from a flow upward through the hierarchy to the root promise.</summary>
    /// <param name="flowId">The flow ID whose children changed.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <exception cref="KeyNotFoundException">Flow, journey, epic, or promise not found.</exception>
    public async Task RecalculateFromFlowAsync(int flowId, CancellationToken cancellationToken = default)
    {
        var flow = await _flowRepository.GetByIdAsync(flowId, cancellationToken)
                   ?? throw new KeyNotFoundException($"Flow with ID {flowId} not found.");

        await RecalculateFlowAsync(flow, cancellationToken);

        var journey = await _journeyRepository.GetByIdAsync(flow.JourneyId, cancellationToken)
                     ?? throw new KeyNotFoundException($"Journey with ID {flow.JourneyId} not found.");
        await RecalculateJourneyAsync(journey, cancellationToken);

        var epic = await _epicRepository.GetByIdAsync(journey.EpicId, cancellationToken)
                  ?? throw new KeyNotFoundException($"Epic with ID {journey.EpicId} not found.");
        await RecalculateEpicAsync(epic, cancellationToken);

        var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId, cancellationToken)
                     ?? throw new KeyNotFoundException($"Promise with ID {epic.ProductPromiseId} not found.");
        await RecalculatePromiseAsync(promise, cancellationToken);

        await _flowRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Recalculate status from a journey upward through the hierarchy to the root promise.</summary>
    /// <param name="journeyId">The journey ID whose children changed.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <exception cref="KeyNotFoundException">Journey, epic, or promise not found.</exception>
    public async Task RecalculateFromJourneyAsync(int journeyId, CancellationToken cancellationToken = default)
    {
        var journey = await _journeyRepository.GetByIdAsync(journeyId, cancellationToken)
                     ?? throw new KeyNotFoundException($"Journey with ID {journeyId} not found.");

        await RecalculateJourneyAsync(journey, cancellationToken);

        var epic = await _epicRepository.GetByIdAsync(journey.EpicId, cancellationToken)
                  ?? throw new KeyNotFoundException($"Epic with ID {journey.EpicId} not found.");
        await RecalculateEpicAsync(epic, cancellationToken);

        var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId, cancellationToken)
                     ?? throw new KeyNotFoundException($"Promise with ID {epic.ProductPromiseId} not found.");
        await RecalculatePromiseAsync(promise, cancellationToken);

        await _journeyRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Recalculate status from an epic upward to the root promise.</summary>
    /// <param name="epicId">The epic ID whose children changed.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <exception cref="KeyNotFoundException">Epic or promise not found.</exception>
    public async Task RecalculateFromEpicAsync(int epicId, CancellationToken cancellationToken = default)
    {
        var epic = await _epicRepository.GetByIdAsync(epicId, cancellationToken)
                  ?? throw new KeyNotFoundException($"Epic with ID {epicId} not found.");

        await RecalculateEpicAsync(epic, cancellationToken);

        var promise = await _promiseRepository.GetByIdAsync(epic.ProductPromiseId, cancellationToken)
                     ?? throw new KeyNotFoundException($"Promise with ID {epic.ProductPromiseId} not found.");
        await RecalculatePromiseAsync(promise, cancellationToken);

        await _epicRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Recalculate the status of a promise based on its child epics.</summary>
    /// <param name="promiseId">The promise ID whose children changed.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <exception cref="KeyNotFoundException">Promise not found.</exception>
    public async Task RecalculateFromPromiseAsync(int promiseId, CancellationToken cancellationToken = default)
    {
        var promise = await _promiseRepository.GetByIdAsync(promiseId, cancellationToken)
                     ?? throw new KeyNotFoundException($"Promise with ID {promiseId} not found.");

        await RecalculatePromiseAsync(promise, cancellationToken);
        await _promiseRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Recalculate a flow's status color from its child moments.</summary>
    /// <param name="flow">The flow entity.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task RecalculateFlowAsync(Flow flow, CancellationToken cancellationToken = default)
    {
        var moments = await _momentRepository.GetMomentsByFlowAsync(flow.Id, cancellationToken);
        flow.StatusColor = StatusColorRules.RollUp(moments.Select(moment => moment.StatusColor));
        flow.UpdatedAt = DateTime.UtcNow;
        _flowRepository.Update(flow);
    }

    /// <summary>Recalculate a journey's status color from its child flows.</summary>
    /// <param name="journey">The journey entity.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task RecalculateJourneyAsync(Journey journey, CancellationToken cancellationToken = default)
    {
        var flows = await _flowRepository.GetFlowsByJourneyAsync(journey.Id, cancellationToken);
        journey.StatusColor = StatusColorRules.RollUp(flows.Select(flow => flow.StatusColor));
        journey.UpdatedAt = DateTime.UtcNow;
        _journeyRepository.Update(journey);
    }

    /// <summary>Recalculate an epic's status color from its child journeys.</summary>
    /// <param name="epic">The epic entity.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task RecalculateEpicAsync(Epic epic, CancellationToken cancellationToken = default)
    {
        var journeys = await _journeyRepository.GetJourneysByEpicAsync(epic.Id, cancellationToken);
        epic.StatusColor = StatusColorRules.RollUp(journeys.Select(journey => journey.StatusColor));
        epic.UpdatedAt = DateTime.UtcNow;
        _epicRepository.Update(epic);
    }

    /// <summary>Recalculate a promise's status color from its child epics.</summary>
    /// <param name="promise">The promise entity.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task RecalculatePromiseAsync(Promise promise, CancellationToken cancellationToken = default)
    {
        var epics = await _epicRepository.GetEpicsByPromiseAsync(promise.Id, cancellationToken);
        promise.StatusColor = StatusColorRules.RollUp(epics.Select(epic => epic.StatusColor));
        promise.UpdatedAt = DateTime.UtcNow;
        _promiseRepository.Update(promise);
    }
}
