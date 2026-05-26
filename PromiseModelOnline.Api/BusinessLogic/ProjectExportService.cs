using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

public sealed class ProjectExportService : IProjectExportService
{
    private const string ExportSchemaVersion = "1.0";

    private readonly IProjectRepository _projectRepository;
    private readonly IEpicRepository _epicRepository;
    private readonly IJourneyRepository _journeyRepository;
    private readonly IFlowRepository _flowRepository;
    private readonly IMomentRepository _momentRepository;
    private readonly IMomentTaskRepository _momentTaskRepository;
    private readonly IIterationRepository _iterationRepository;
    private readonly IStrideRepository _strideRepository;

    public ProjectExportService(
        IProjectRepository projectRepository,
        IEpicRepository epicRepository,
        IJourneyRepository journeyRepository,
        IFlowRepository flowRepository,
        IMomentRepository momentRepository,
        IMomentTaskRepository momentTaskRepository,
        IIterationRepository iterationRepository,
        IStrideRepository strideRepository)
    {
        _projectRepository = projectRepository;
        _epicRepository = epicRepository;
        _journeyRepository = journeyRepository;
        _flowRepository = flowRepository;
        _momentRepository = momentRepository;
        _momentTaskRepository = momentTaskRepository;
        _iterationRepository = iterationRepository;
        _strideRepository = strideRepository;
    }

    public async Task<ProjectExportDocument> BuildExportAsync(int projectId)
    {
        var project = await _projectRepository.GetByIdAsync(projectId)
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

        var promises = await _projectRepository.GetProductPromisesByProjectAsync(projectId);
        foreach (var promise in OrderByDisplayOrder(promises))
        {
            document.Project.ProductPromises.Add(await BuildPromiseAsync(promise));
        }

        var iterations = await _iterationRepository.GetIterationsByProjectAsync(projectId);
        foreach (var iteration in OrderByIteration(iterations))
        {
            document.Project.Iterations.Add(await BuildIterationAsync(iteration));
        }

        return document;
    }

    private async Task<ProjectExportPromise> BuildPromiseAsync(Promise promise)
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

        var epics = await _epicRepository.GetEpicsByPromiseAsync(promise.Id);
        foreach (var epic in OrderByDisplayOrder(epics))
        {
            exportPromise.Epics.Add(await BuildEpicAsync(epic));
        }

        return exportPromise;
    }

    private async Task<ProjectExportEpic> BuildEpicAsync(Epic epic)
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

        var journeys = await _journeyRepository.GetJourneysByEpicAsync(epic.Id);
        foreach (var journey in OrderByDisplayOrder(journeys))
        {
            exportEpic.Journeys.Add(await BuildJourneyAsync(journey));
        }

        return exportEpic;
    }

    private async Task<ProjectExportJourney> BuildJourneyAsync(Journey journey)
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

        var flows = await _flowRepository.GetFlowsByJourneyAsync(journey.Id);
        foreach (var flow in OrderByDisplayOrder(flows))
        {
            exportJourney.Flows.Add(await BuildFlowAsync(flow));
        }

        return exportJourney;
    }

    private async Task<ProjectExportFlow> BuildFlowAsync(Flow flow)
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

        var moments = await _momentRepository.GetMomentsByFlowAsync(flow.Id);
        foreach (var moment in OrderByDisplayOrder(moments))
        {
            exportFlow.Moments.Add(await BuildMomentAsync(moment));
        }

        return exportFlow;
    }

    private async Task<ProjectExportMoment> BuildMomentAsync(Moment moment)
    {
        var tasks = await _momentTaskRepository.GetTasksByMomentAsync(moment.Id);

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

    private async Task<ProjectExportIteration> BuildIterationAsync(Iteration iteration)
    {
        var exportIteration = new ProjectExportIteration
        {
            Id = iteration.Id,
            ProjectId = iteration.ProjectId,
            Name = iteration.Name,
            CreatedAt = iteration.CreatedAt,
            Strides = new List<ProjectExportStride>()
        };

        var strides = await _strideRepository.GetStridesByIterationAsync(iteration.Id);
        foreach (var stride in OrderByStride(strides))
        {
            exportIteration.Strides.Add(await BuildStrideAsync(stride));
        }

        return exportIteration;
    }

    private async Task<ProjectExportStride> BuildStrideAsync(Stride stride)
    {
        var moments = await _momentRepository.GetMomentsByStrideAsync(stride.Id);

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

    private static ProjectExportMomentTask MapTask(MomentTask task)
    {
        return new ProjectExportMomentTask
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
    }

    private static IOrderedEnumerable<T> OrderByDisplayOrder<T>(IEnumerable<T> items) where T : class
    {
        return items.OrderBy(GetDisplayOrder).ThenBy(GetId);
    }

    private static IOrderedEnumerable<Iteration> OrderByIteration(IEnumerable<Iteration> items)
    {
        return items.OrderBy(iteration => iteration.Id).ThenBy(iteration => iteration.Name);
    }

    private static IOrderedEnumerable<Stride> OrderByStride(IEnumerable<Stride> items)
    {
        return items.OrderBy(stride => stride.StartDate).ThenBy(stride => stride.Id);
    }

    private static int GetDisplayOrder<T>(T item) where T : class
    {
        var property = item.GetType().GetProperty("DisplayOrder");
        if (property?.GetValue(item) is int value)
        {
            return value;
        }

        return 0;
    }

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