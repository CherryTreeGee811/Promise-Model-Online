using Microsoft.EntityFrameworkCore;
using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

public sealed class ProjectImportService : IProjectImportService
{
    private readonly IPromiseModelOnlineContext _context;
    private readonly IProjectRepository _projectRepository;
    private readonly IGenericRepository<Promise> _promiseRepository;
    private readonly IEpicRepository _epicRepository;
    private readonly IJourneyRepository _journeyRepository;
    private readonly IFlowRepository _flowRepository;
    private readonly IMomentRepository _momentRepository;
    private readonly IMomentTaskRepository _momentTaskRepository;
    private readonly IIterationRepository _iterationRepository;
    private readonly IStrideRepository _strideRepository;
    private readonly IUserRepository _userRepository;

    public ProjectImportService(
        IPromiseModelOnlineContext context,
        IProjectRepository projectRepository,
        IGenericRepository<Promise> promiseRepository,
        IEpicRepository epicRepository,
        IJourneyRepository journeyRepository,
        IFlowRepository flowRepository,
        IMomentRepository momentRepository,
        IMomentTaskRepository momentTaskRepository,
        IIterationRepository iterationRepository,
        IStrideRepository strideRepository,
        IUserRepository userRepository)
    {
        _context = context;
        _projectRepository = projectRepository;
        _promiseRepository = promiseRepository;
        _epicRepository = epicRepository;
        _journeyRepository = journeyRepository;
        _flowRepository = flowRepository;
        _momentRepository = momentRepository;
        _momentTaskRepository = momentTaskRepository;
        _iterationRepository = iterationRepository;
        _strideRepository = strideRepository;
        _userRepository = userRepository;
    }

    public async Task<ProjectImportResult> ImportAsync(ProjectExportDocument document, int requestedByUserId)
    {
        if (document.Project is null)
        {
            throw new InvalidDataException("Project section is missing.");
        }

        return await ExecuteInTransactionAsync(async () =>
        {
            var warnings = new List<string>();
            var strideIdMap = new Dictionary<int, int>();

            var project = new Project
            {
                Name = document.Project.Name,
                Description = document.Project.Description,
                OwnerId = await ResolveRequiredOwnerIdAsync(document.Project.OwnerId, requestedByUserId, warnings, $"project {document.Project.Id}"),
                CreatedAt = document.Project.CreatedAt
            };

            await _projectRepository.AddAsync(project);
            await _projectRepository.SaveChangesAsync();

            foreach (var iteration in OrderByIteration(document.Project.Iterations))
            {
                var newIteration = new Iteration
                {
                    ProjectId = project.Id,
                    Name = iteration.Name,
                    CreatedAt = iteration.CreatedAt
                };

                await _iterationRepository.AddAsync(newIteration);
                await _iterationRepository.SaveChangesAsync();

                foreach (var stride in OrderByStride(iteration.Strides))
                {
                    var newStride = new Stride
                    {
                        IterationId = newIteration.Id,
                        Name = stride.Name,
                        StartDate = stride.StartDate,
                        EndDate = stride.EndDate,
                        DurationDays = stride.DurationDays,
                        IsActive = stride.IsActive,
                        CreatedAt = stride.CreatedAt
                    };

                    await _strideRepository.AddAsync(newStride);
                    await _strideRepository.SaveChangesAsync();
                    strideIdMap[stride.Id] = newStride.Id;
                }
            }

            foreach (var promise in OrderByDisplayOrder(document.Project.ProductPromises))
            {
                await ImportPromiseAsync(project.Id, promise, requestedByUserId, warnings, strideIdMap);
            }

            return new ProjectImportResult
            {
                ProjectId = project.Id,
                Warnings = warnings
            };
        });
    }

    private async Task ImportPromiseAsync(
        int projectId,
        ProjectExportPromise promise,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap)
    {
        var newPromise = new Promise
        {
            ProjectId = projectId,
            Statement = promise.Statement,
            Description = promise.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(promise.OwnerId, requestedByUserId, warnings, $"promise {promise.Id}"),
            DisplayOrder = promise.DisplayOrder,
            CreatedAt = promise.CreatedAt,
            UpdatedAt = promise.UpdatedAt,
            StatusColor = promise.StatusColor
        };

        await _promiseRepository.AddAsync(newPromise);
        await _promiseRepository.SaveChangesAsync();

        foreach (var epic in OrderByDisplayOrder(promise.Epics))
        {
            await ImportEpicAsync(newPromise.Id, epic, requestedByUserId, warnings, strideIdMap);
        }
    }

    private static IOrderedEnumerable<T> OrderByDisplayOrder<T>(IEnumerable<T> items) where T : class
    {
        return items.OrderBy(GetDisplayOrder).ThenBy(GetId);
    }

    private static IOrderedEnumerable<ProjectExportIteration> OrderByIteration(IEnumerable<ProjectExportIteration> items)
    {
        return items.OrderBy(item => item.Id).ThenBy(item => item.Name);
    }

    private static IOrderedEnumerable<ProjectExportStride> OrderByStride(IEnumerable<ProjectExportStride> items)
    {
        return items.OrderBy(item => item.StartDate).ThenBy(item => item.Id);
    }

    private static int GetDisplayOrder<T>(T item) where T : class
    {
        var prop = item.GetType().GetProperty("DisplayOrder");
        if (prop?.GetValue(item) is int value)
            return value;

        return 0;
    }

    private static int GetId<T>(T item) where T : class
    {
        var prop = item.GetType().GetProperty("Id");
        if (prop?.GetValue(item) is int value)
            return value;

        return 0;
    }

    private async Task<int> ResolveRequiredOwnerIdAsync(int? exportedOwnerId, int fallbackUserId, List<string> warnings, string entityLabel)
    {
        var resolvedOwnerId = await ResolveOptionalOwnerIdAsync(exportedOwnerId, fallbackUserId, warnings, entityLabel);
        return resolvedOwnerId ?? fallbackUserId;
    }

    private async Task<int?> ResolveOptionalOwnerIdAsync(int? exportedOwnerId, int fallbackUserId, List<string> warnings, string entityLabel)
    {
        if (!exportedOwnerId.HasValue)
        {
            return null;
        }

        var user = await _userRepository.GetByIdAsync(exportedOwnerId.Value);
        if (user is not null)
        {
            return exportedOwnerId;
        }

        warnings.Add($"{entityLabel} owner {exportedOwnerId.Value} was not found; remapped to user {fallbackUserId}.");
        return fallbackUserId;
    }

    private async Task<int?> ResolveStrideIdAsync(int? exportedStrideId, Dictionary<int, int> strideIdMap, List<string> warnings, string entityLabel, string referenceName)
    {
        if (!exportedStrideId.HasValue)
        {
            return null;
        }

        if (strideIdMap.TryGetValue(exportedStrideId.Value, out var mappedStrideId))
        {
            return mappedStrideId;
        }

        warnings.Add($"{entityLabel} {referenceName} stride {exportedStrideId.Value} was not found; cleared during import.");
        return null;
    }

    private async Task ImportEpicAsync(
        int promiseId,
        ProjectExportEpic epic,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap)
    {
        var newEpic = new Epic
        {
            ProductPromiseId = promiseId,
            Statement = epic.Statement,
            Description = epic.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(epic.OwnerId, requestedByUserId, warnings, $"epic {epic.Id}"),
            DisplayOrder = epic.DisplayOrder,
            CreatedAt = epic.CreatedAt,
            UpdatedAt = epic.UpdatedAt,
            StatusColor = epic.StatusColor
        };

        await _epicRepository.AddAsync(newEpic);
        await _epicRepository.SaveChangesAsync();

        foreach (var journey in OrderByDisplayOrder(epic.Journeys))
        {
            await ImportJourneyAsync(newEpic.Id, journey, requestedByUserId, warnings, strideIdMap);
        }
    }

    private async Task ImportJourneyAsync(
        int epicId,
        ProjectExportJourney journey,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap)
    {
        var newJourney = new Journey
        {
            EpicId = epicId,
            Statement = journey.Statement,
            Description = journey.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(journey.OwnerId, requestedByUserId, warnings, $"journey {journey.Id}"),
            DisplayOrder = journey.DisplayOrder,
            CreatedAt = journey.CreatedAt,
            UpdatedAt = journey.UpdatedAt,
            StatusColor = journey.StatusColor
        };

        await _journeyRepository.AddAsync(newJourney);
        await _journeyRepository.SaveChangesAsync();

        foreach (var flow in OrderByDisplayOrder(journey.Flows))
        {
            await ImportFlowAsync(newJourney.Id, flow, requestedByUserId, warnings, strideIdMap);
        }
    }

    private async Task ImportFlowAsync(
        int journeyId,
        ProjectExportFlow flow,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap)
    {
        var newFlow = new Flow
        {
            JourneyId = journeyId,
            Statement = flow.Statement,
            Description = flow.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(flow.OwnerId, requestedByUserId, warnings, $"flow {flow.Id}"),
            DisplayOrder = flow.DisplayOrder,
            CreatedAt = flow.CreatedAt,
            UpdatedAt = flow.UpdatedAt,
            StatusColor = flow.StatusColor
        };

        await _flowRepository.AddAsync(newFlow);
        await _flowRepository.SaveChangesAsync();

        foreach (var moment in OrderByDisplayOrder(flow.Moments))
        {
            await ImportMomentAsync(newFlow.Id, moment, requestedByUserId, warnings, strideIdMap);
        }
    }

    private async Task ImportMomentAsync(
        int flowId,
        ProjectExportMoment moment,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap)
    {
        var newMoment = new Moment
        {
            FlowId = flowId,
            Statement = moment.Statement,
            Description = moment.Description,
            Type = moment.Type,
            Status = moment.Status,
            EffortEstimate = moment.EffortEstimate,
            OwnerId = await ResolveOptionalOwnerIdAsync(moment.OwnerId, requestedByUserId, warnings, $"moment {moment.Id}"),
            AssignedStrideId = await ResolveStrideIdAsync(moment.AssignedStrideId, strideIdMap, warnings, $"moment {moment.Id}", "assigned"),
            DisplayOrder = moment.DisplayOrder,
            CreatedAt = moment.CreatedAt,
            UpdatedAt = moment.UpdatedAt,
            CompletedAt = moment.CompletedAt,
            IsZombie = moment.IsZombie,
            OriginalStrideId = await ResolveStrideIdAsync(moment.OriginalStrideId, strideIdMap, warnings, $"moment {moment.Id}", "original"),
            StatusColor = moment.StatusColor
        };

        await _momentRepository.AddAsync(newMoment);
        await _momentRepository.SaveChangesAsync();

        foreach (var task in moment.Tasks.OrderBy(task => task.Id))
        {
            await ImportTaskAsync(newMoment.Id, task, requestedByUserId, warnings);
        }
    }

    private async Task ImportTaskAsync(
        int momentId,
        ProjectExportMomentTask task,
        int requestedByUserId,
        List<string> warnings)
    {
        var newTask = new MomentTask
        {
            MomentId = momentId,
            Name = task.Name,
            Description = task.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(task.OwnerId, requestedByUserId, warnings, $"task {task.Id}"),
            IsCompleted = task.IsCompleted,
            CreatedAt = task.CreatedAt,
            CompletedAt = task.CompletedAt
        };

        await _momentTaskRepository.AddAsync(newTask);
        await _momentTaskRepository.SaveChangesAsync();
    }

    private async Task<TResult> ExecuteInTransactionAsync<TResult>(Func<Task<TResult>> action)
    {
        if (_context is DbContext dbContext)
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync();
            try
            {
                var result = await action();
                await transaction.CommitAsync();
                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        return await action();
    }
}
