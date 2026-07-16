using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Builds a portable export document from a project's full hierarchy.</summary>
/// <remarks>
///   Traverses the complete promise model tree (project -> promises -> epics -> journeys -> flows
///   -> moments -> tasks, plus iterations and strides) and serializes it into a
///   <see cref="ProjectExportDocument"/> for backup or transfer. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the export service with all hierarchy repositories.</remarks>
/// <param name="projectRepository">Repository for project data access.</param>
/// <param name="epicRepository">Repository for epic data access.</param>
/// <param name="journeyRepository">Repository for journey data access.</param>
/// <param name="flowRepository">Repository for flow data access.</param>
/// <param name="momentRepository">Repository for moment data access.</param>
/// <param name="momentTaskRepository">Repository for moment sub-task data access.</param>
/// <param name="iterationRepository">Repository for iteration data access.</param>
/// <param name="strideRepository">Repository for stride data access.</param>
public sealed class ProjectExportService(
    IProjectRepository projectRepository,
    IEpicRepository epicRepository,
    IJourneyRepository journeyRepository,
    IFlowRepository flowRepository,
    IMomentRepository momentRepository,
    IMomentTaskRepository momentTaskRepository,
    IIterationRepository iterationRepository,
    IStrideRepository strideRepository) : IProjectExportService
{
    private const string ExportSchemaVersion = "1.0";

    private readonly IProjectRepository _projectRepository = projectRepository;
    private readonly IEpicRepository _epicRepository = epicRepository;
    private readonly IJourneyRepository _journeyRepository = journeyRepository;
    private readonly IFlowRepository _flowRepository = flowRepository;
    private readonly IMomentRepository _momentRepository = momentRepository;
    private readonly IMomentTaskRepository _momentTaskRepository = momentTaskRepository;
    private readonly IIterationRepository _iterationRepository = iterationRepository;
    private readonly IStrideRepository _strideRepository = strideRepository;

    /// <summary>Build a complete export document for a project, including all hierarchy entities and metadata.</summary>
    /// <param name="projectId">The project ID to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A fully populated <see cref="ProjectExportDocument"/>.</returns>
    /// <exception cref="KeyNotFoundException">Project not found.</exception>
    public async Task<ProjectExportDocument> BuildExportAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken)
                      ?? throw new KeyNotFoundException($"Project with ID {projectId} was not found.");

        var document = new ProjectExportDocument
        {
            SchemaVersion = ExportSchemaVersion,
            ExportedAt = DateTime.UtcNow,
            Project = new ProjectExportProject
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                OwnerId = project.OwnerId,
                CreatedAt = project.CreatedAt,
                ProductPromises = new List<ProjectExportPromise>(),
                Iterations = new List<ProjectExportIteration>()
            }
        };

        var promises = await _projectRepository.GetProductPromisesByProjectAsync(projectId, cancellationToken);
        foreach (var promise in OrderByDisplayOrder(promises))
        {
            document.Project.ProductPromises.Add(await BuildPromiseAsync(promise, cancellationToken));
        }

        var iterations = await _iterationRepository.GetIterationsByProjectAsync(projectId, cancellationToken);
        foreach (var iteration in OrderByIteration(iterations))
        {
            document.Project.Iterations.Add(await BuildIterationAsync(iteration, cancellationToken));
        }

        return document;
    }

    /// <summary>Build an export promise node including its child epics.</summary>
    /// <param name="promise">The promise entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export promise DTO with nested epics.</returns>
    private async Task<ProjectExportPromise> BuildPromiseAsync(Promise promise, CancellationToken cancellationToken = default)
    {
        var exportPromise = new ProjectExportPromise
        {
            Id = promise.Id,
            ProjectId = promise.ProjectId,
            Statement = promise.Statement,
            Description = promise.Description,
            OwnerId = promise.OwnerId,
            DisplayOrder = promise.DisplayOrder,
            CreatedAt = promise.CreatedAt,
            UpdatedAt = promise.UpdatedAt,
            StatusColor = promise.StatusColor,
            Epics = new List<ProjectExportEpic>()
        };

        var epics = await _epicRepository.GetEpicsByPromiseAsync(promise.Id, cancellationToken);
        foreach (var epic in OrderByDisplayOrder(epics))
        {
            exportPromise.Epics.Add(await BuildEpicAsync(epic, cancellationToken));
        }

        return exportPromise;
    }

    /// <summary>Build an export epic node including its child journeys.</summary>
    /// <param name="epic">The epic entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export epic DTO with nested journeys.</returns>
    private async Task<ProjectExportEpic> BuildEpicAsync(Epic epic, CancellationToken cancellationToken = default)
    {
        var exportEpic = new ProjectExportEpic
        {
            Id = epic.Id,
            ProductPromiseId = epic.ProductPromiseId,
            Statement = epic.Statement,
            Description = epic.Description,
            OwnerId = epic.OwnerId,
            DisplayOrder = epic.DisplayOrder,
            CreatedAt = epic.CreatedAt,
            UpdatedAt = epic.UpdatedAt,
            StatusColor = epic.StatusColor,
            Journeys = new List<ProjectExportJourney>()
        };

        var journeys = await _journeyRepository.GetJourneysByEpicAsync(epic.Id, cancellationToken);
        foreach (var journey in OrderByDisplayOrder(journeys))
        {
            exportEpic.Journeys.Add(await BuildJourneyAsync(journey, cancellationToken));
        }

        return exportEpic;
    }

    /// <summary>Build an export journey node including its child flows.</summary>
    /// <param name="journey">The journey entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export journey DTO with nested flows.</returns>
    private async Task<ProjectExportJourney> BuildJourneyAsync(Journey journey, CancellationToken cancellationToken = default)
    {
        var exportJourney = new ProjectExportJourney
        {
            Id = journey.Id,
            EpicId = journey.EpicId,
            Statement = journey.Statement,
            Description = journey.Description,
            OwnerId = journey.OwnerId,
            DisplayOrder = journey.DisplayOrder,
            CreatedAt = journey.CreatedAt,
            UpdatedAt = journey.UpdatedAt,
            StatusColor = journey.StatusColor,
            Flows = new List<ProjectExportFlow>()
        };

        var flows = await _flowRepository.GetFlowsByJourneyAsync(journey.Id, cancellationToken);
        foreach (var flow in OrderByDisplayOrder(flows))
        {
            exportJourney.Flows.Add(await BuildFlowAsync(flow, cancellationToken));
        }

        return exportJourney;
    }

    /// <summary>Build an export flow node including its child moments.</summary>
    /// <param name="flow">The flow entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export flow DTO with nested moments.</returns>
    private async Task<ProjectExportFlow> BuildFlowAsync(Flow flow, CancellationToken cancellationToken = default)
    {
        var exportFlow = new ProjectExportFlow
        {
            Id = flow.Id,
            JourneyId = flow.JourneyId,
            Statement = flow.Statement,
            Description = flow.Description,
            OwnerId = flow.OwnerId,
            DisplayOrder = flow.DisplayOrder,
            CreatedAt = flow.CreatedAt,
            UpdatedAt = flow.UpdatedAt,
            StatusColor = flow.StatusColor,
            Moments = new List<ProjectExportMoment>()
        };

        var moments = await _momentRepository.GetMomentsByFlowAsync(flow.Id, cancellationToken);
        foreach (var moment in OrderByDisplayOrder(moments))
        {
            exportFlow.Moments.Add(await BuildMomentAsync(moment, cancellationToken));
        }

        return exportFlow;
    }

    /// <summary>Build an export moment node including its sub-tasks.</summary>
    /// <param name="moment">The moment entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export moment DTO with nested tasks.</returns>
    private async Task<ProjectExportMoment> BuildMomentAsync(Moment moment, CancellationToken cancellationToken = default)
    {
        var tasks = await _momentTaskRepository.GetTasksByMomentAsync(moment.Id, cancellationToken);

        return new ProjectExportMoment
        {
            Id = moment.Id,
            FlowId = moment.FlowId,
            Statement = moment.Statement,
            Description = moment.Description,
            Type = moment.Type,
            Status = moment.Status,
            EffortEstimate = moment.EffortEstimate,
            OwnerId = moment.OwnerId,
            AssignedStrideId = moment.AssignedStrideId,
            DisplayOrder = moment.DisplayOrder,
            CreatedAt = moment.CreatedAt,
            UpdatedAt = moment.UpdatedAt,
            CompletedAt = moment.CompletedAt,
            IsZombie = moment.IsZombie,
            OriginalStrideId = moment.OriginalStrideId,
            StatusColor = moment.StatusColor,
            Tasks = tasks.OrderBy(task => task.Id).Select(MapTask).ToList()
        };
    }

    /// <summary>Build an export iteration node including its child strides.</summary>
    /// <param name="iteration">The iteration entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export iteration DTO with nested strides.</returns>
    private async Task<ProjectExportIteration> BuildIterationAsync(Iteration iteration, CancellationToken cancellationToken = default)
    {
        var exportIteration = new ProjectExportIteration
        {
            Id = iteration.Id,
            ProjectId = iteration.ProjectId,
            Name = iteration.Name,
            CreatedAt = iteration.CreatedAt,
            Strides = new List<ProjectExportStride>()
        };

        var strides = await _strideRepository.GetStridesByIterationAsync(iteration.Id, cancellationToken);
        foreach (var stride in OrderByStride(strides))
        {
            exportIteration.Strides.Add(await BuildStrideAsync(stride, cancellationToken));
        }

        return exportIteration;
    }

    /// <summary>Build an export stride node including associated moment IDs.</summary>
    /// <param name="stride">The stride entity to export.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An export stride DTO with associated moment IDs.</returns>
    private async Task<ProjectExportStride> BuildStrideAsync(Stride stride, CancellationToken cancellationToken = default)
    {
        var moments = await _momentRepository.GetMomentsByStrideAsync(stride.Id, cancellationToken);

        return new ProjectExportStride
        {
            Id = stride.Id,
            IterationId = stride.IterationId,
            Name = stride.Name,
            StartDate = stride.StartDate,
            EndDate = stride.EndDate,
            DurationDays = stride.DurationDays,
            IsActive = stride.IsActive,
            CreatedAt = stride.CreatedAt,
            MomentIds = moments
                .OrderBy(moment => moment.DisplayOrder)
                .ThenBy(moment => moment.Id)
                .Select(moment => moment.Id)
                .ToList()
        };
    }

    /// <summary>Map a <see cref="MomentTask"/> to its export DTO.</summary>
    /// <param name="task">The moment task to map.</param>
    /// <returns>The mapped export moment task DTO.</returns>
    private static ProjectExportMomentTask MapTask(MomentTask task) => new ProjectExportMomentTask
    {
        Id = task.Id,
        MomentId = task.MomentId,
        Name = task.Name,
        Description = task.Description,
        OwnerId = task.OwnerId,
        IsCompleted = task.IsCompleted,
        CreatedAt = task.CreatedAt,
        CompletedAt = task.CompletedAt
    };

    /// <summary>Order items by <c>DisplayOrder</c> then <c>Id</c> for consistent export output.</summary>
    /// <param name="items">The items to order.</param>
    /// <returns>The ordered items.</returns>
    private static IOrderedEnumerable<T> OrderByDisplayOrder<T>(IEnumerable<T> items) where T : class => items.OrderBy(GetDisplayOrder).ThenBy(GetId);

    /// <summary>Order iterations by ID then name.</summary>
    private static IOrderedEnumerable<Iteration> OrderByIteration(IEnumerable<Iteration> items) => items.OrderBy(iteration => iteration.Id).ThenBy(iteration => iteration.Name);

    /// <summary>Order strides by start date then ID.</summary>
    private static IOrderedEnumerable<Stride> OrderByStride(IEnumerable<Stride> items) => items.OrderBy(stride => stride.StartDate).ThenBy(stride => stride.Id);

    /// <summary>Get the <c>DisplayOrder</c> property value from an item via reflection.</summary>
    private static int GetDisplayOrder<T>(T item) where T : class
    {
        var property = item.GetType().GetProperty("DisplayOrder");
        if (property?.GetValue(item) is int value)
        {
            return value;
        }

        return 0;
    }

    /// <summary>Get the <c>Id</c> property value from an item via reflection.</summary>
    private static int GetId<T>(T item) where T : class
    {
        var property = item.GetType().GetProperty("Id");
        if (property?.GetValue(item) is int value)
        {
            return value;
        }

        return 0;
    }
}
