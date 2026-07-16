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
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Reconstructs a project from a portable export document.</summary>
/// <remarks>
///   Parses an <see cref="ProjectExportDocument"/> and recreates the full hierarchy (project,
///   promises, epics, journeys, flows, moments, tasks, iterations, strides) in the database.
///   Uses the context's atomic sequence allocator to assign sequence numbers. Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the import service with all required repositories.</remarks>
public sealed class ProjectImportService(
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
    IUserRepository userRepository) : IProjectImportService
{
    private static readonly System.Text.RegularExpressions.Regex SlugInvalidChars = new(
        @"[^a-z0-9\s-]",
        System.Text.RegularExpressions.RegexOptions.None,
        TimeSpan.FromMilliseconds(500));

    private readonly IPromiseModelOnlineContext _context = context;
    private readonly IProjectRepository _projectRepository = projectRepository;
    private readonly IGenericRepository<Promise> _promiseRepository = promiseRepository;
    private readonly IEpicRepository _epicRepository = epicRepository;
    private readonly IJourneyRepository _journeyRepository = journeyRepository;
    private readonly IFlowRepository _flowRepository = flowRepository;
    private readonly IMomentRepository _momentRepository = momentRepository;
    private readonly IMomentTaskRepository _momentTaskRepository = momentTaskRepository;
    private readonly IIterationRepository _iterationRepository = iterationRepository;
    private readonly IStrideRepository _strideRepository = strideRepository;
    private readonly IUserRepository _userRepository = userRepository;

    /// <summary>Import a project from an export document, recreating the full hierarchy in the database.</summary>
    /// <param name="document">The export document containing the project data.</param>
    /// <param name="requestedByUserId">The user ID requesting the import (becomes the project owner).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An <see cref="ProjectImportResult"/> with the new project ID and any warnings.</returns>
    /// <exception cref="InvalidDataException">Project section is missing from the document.</exception>
    public async Task<ProjectImportResult> ImportAsync(ProjectExportDocument document, int requestedByUserId, CancellationToken cancellationToken = default)
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
                Slug = Slugify(document.Project.Name),
                Description = document.Project.Description,
                OwnerId = requestedByUserId,
                CreatedAt = document.Project.CreatedAt
            };

            await _projectRepository.AddAsync(project, cancellationToken);
            await _projectRepository.SaveChangesAsync(cancellationToken);

            var owner = await _userRepository.GetByIdAsync(requestedByUserId, cancellationToken);

            foreach (var iteration in OrderByIteration(document.Project.Iterations))
            {
                var newIteration = new Iteration
                {
                    ProjectId = project.Id,
                    Name = iteration.Name,
                    CreatedAt = iteration.CreatedAt
                };

                await _iterationRepository.AddAsync(newIteration, cancellationToken);
                await _iterationRepository.SaveChangesAsync(cancellationToken);

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

                    await _strideRepository.AddAsync(newStride, cancellationToken);
                    await _strideRepository.SaveChangesAsync(cancellationToken);
                    strideIdMap[stride.Id] = newStride.Id;
                }
            }

            foreach (var promise in OrderByDisplayOrder(document.Project.ProductPromises))
            {
                await ImportPromiseAsync(project.Id, promise, requestedByUserId, warnings, strideIdMap, cancellationToken);
            }

            return new ProjectImportResult
            {
                ProjectId = project.Id,
                Warnings = warnings,
                OwnerSlug = owner?.Slug,
                Slug = project.Slug
            };
        }, cancellationToken);
    }

    /// <summary>Import a single promise and recursively import its child epics.</summary>
    /// <param name="projectId">The project ID to associate the promise with.</param>
    /// <param name="promise">The exported promise data.</param>
    /// <param name="requestedByUserId">The requesting user ID for owner resolution.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="strideIdMap">Mapping of exported stride IDs to new stride IDs.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task ImportPromiseAsync(
        int projectId,
        ProjectExportPromise promise,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap,
        CancellationToken cancellationToken = default)
    {
        var nextSeq = await _context.GetNextPromiseSequenceAsync(projectId, cancellationToken);

        var newPromise = new Promise
        {
            ProjectId = projectId,
            Statement = promise.Statement,
            Description = promise.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(promise.OwnerId, requestedByUserId, warnings, $"promise {promise.Id}", cancellationToken),
            SequenceNumber = nextSeq,
            DisplayOrder = promise.DisplayOrder,
            CreatedAt = promise.CreatedAt,
            UpdatedAt = promise.UpdatedAt,
            StatusColor = promise.StatusColor
        };

        await _promiseRepository.AddAsync(newPromise, cancellationToken);
        await _promiseRepository.SaveChangesAsync(cancellationToken);

        foreach (var epic in OrderByDisplayOrder(promise.Epics))
        {
            await ImportEpicAsync(newPromise.Id, epic, requestedByUserId, warnings, strideIdMap, cancellationToken);
        }
    }

    /// <summary>Order export items by <c>DisplayOrder</c> then <c>Id</c> for consistent import order.</summary>
    /// <param name="items">The items to order.</param>
    /// <returns>The ordered items.</returns>
    private static IOrderedEnumerable<T> OrderByDisplayOrder<T>(IEnumerable<T> items) where T : class => items.OrderBy(GetDisplayOrder).ThenBy(GetId);

    /// <summary>Order export iterations by ID then name.</summary>
    /// <param name="items">The iterations to order.</param>
    private static IOrderedEnumerable<ProjectExportIteration> OrderByIteration(IEnumerable<ProjectExportIteration> items) => items.OrderBy(item => item.Id).ThenBy(item => item.Name);

    /// <summary>Order export strides by start date then ID.</summary>
    /// <param name="items">The strides to order.</param>
    private static IOrderedEnumerable<ProjectExportStride> OrderByStride(IEnumerable<ProjectExportStride> items) => items.OrderBy(item => item.StartDate).ThenBy(item => item.Id);

    /// <summary>Get <c>DisplayOrder</c> property via reflection.</summary>
    /// <param name="item">The item to inspect.</param>
    /// <returns>The display order value, or 0.</returns>
    private static int GetDisplayOrder<T>(T item) where T : class
    {
        var prop = item.GetType().GetProperty("DisplayOrder");
        if (prop?.GetValue(item) is int value)
            return value;

        return 0;
    }

    /// <summary>Get <c>Id</c> property via reflection.</summary>
    /// <param name="item">The item to inspect.</param>
    private static int GetId<T>(T item) where T : class
    {
        var prop = item.GetType().GetProperty("Id");
        if (prop?.GetValue(item) is int value)
            return value;

        return 0;
    }

    /// <summary>Resolve an exported owner ID to a valid user ID, with fallback and warning.</summary>
    /// <param name="exportedOwnerId">The exported owner ID from the document.</param>
    /// <param name="fallbackUserId">The fallback user ID if the exported owner is not found.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="entityLabel">A human-readable label for the entity for warning messages.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task<int?> ResolveOptionalOwnerIdAsync(int? exportedOwnerId, int fallbackUserId, List<string> warnings, string entityLabel, CancellationToken cancellationToken = default)
    {
        if (!exportedOwnerId.HasValue)
        {
            return null;
        }

        var user = await _userRepository.GetByIdAsync(exportedOwnerId.Value, cancellationToken);
        if (user is not null)
        {
            return exportedOwnerId;
        }

        warnings.Add($"{entityLabel} owner {exportedOwnerId.Value} was not found; remapped to user {fallbackUserId}.");
        return fallbackUserId;
    }

    /// <summary>Resolve an exported stride ID to the new stride ID via the mapping dictionary.</summary>
    /// <param name="exportedStrideId">The exported stride ID from the document.</param>
    /// <param name="strideIdMap">Dictionary mapping exported stride IDs to new stride IDs.</param>
    /// <param name="warnings">Running list of warnings to append to.</param>
    /// <param name="entityLabel">A human-readable label for the entity for warning messages.</param>
    /// <param name="referenceName">The type of reference (e.g., "assigned", "original") for warnings.</param>
    /// <returns>The mapped stride ID, or null.</returns>
    private static async Task<int?> ResolveStrideIdAsync(int? exportedStrideId, Dictionary<int, int> strideIdMap, List<string> warnings, string entityLabel, string referenceName)
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

    /// <summary>Import a single epic and recursively import its child journeys.</summary>
    /// <param name="promiseId">The parent promise ID.</param>
    /// <param name="epic">The exported epic data.</param>
    /// <param name="requestedByUserId">The requesting user ID for owner resolution.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="strideIdMap">Mapping of exported stride IDs to new stride IDs.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task ImportEpicAsync(
        int promiseId,
        ProjectExportEpic epic,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap,
        CancellationToken cancellationToken = default)
    {
        var nextSeq = await _context.GetNextEpicSequenceAsync(promiseId, cancellationToken);

        var newEpic = new Epic
        {
            ProductPromiseId = promiseId,
            Statement = epic.Statement,
            Description = epic.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(epic.OwnerId, requestedByUserId, warnings, $"epic {epic.Id}", cancellationToken),
            SequenceNumber = nextSeq,
            DisplayOrder = epic.DisplayOrder,
            CreatedAt = epic.CreatedAt,
            UpdatedAt = epic.UpdatedAt,
            StatusColor = epic.StatusColor
        };

        await _epicRepository.AddAsync(newEpic, cancellationToken);
        await _epicRepository.SaveChangesAsync(cancellationToken);

        foreach (var journey in OrderByDisplayOrder(epic.Journeys))
        {
            await ImportJourneyAsync(newEpic.Id, journey, requestedByUserId, warnings, strideIdMap, cancellationToken);
        }
    }

    /// <summary>Import a single journey and recursively import its child flows.</summary>
    /// <param name="epicId">The parent epic ID.</param>
    /// <param name="journey">The exported journey data.</param>
    /// <param name="requestedByUserId">The requesting user ID for owner resolution.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="strideIdMap">Mapping of exported stride IDs to new stride IDs.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task ImportJourneyAsync(
        int epicId,
        ProjectExportJourney journey,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap,
        CancellationToken cancellationToken = default)
    {
        var nextSeq = await _context.GetNextJourneySequenceAsync(epicId, cancellationToken);

        var newJourney = new Journey
        {
            EpicId = epicId,
            Statement = journey.Statement,
            Description = journey.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(journey.OwnerId, requestedByUserId, warnings, $"journey {journey.Id}", cancellationToken),
            SequenceNumber = nextSeq,
            DisplayOrder = journey.DisplayOrder,
            CreatedAt = journey.CreatedAt,
            UpdatedAt = journey.UpdatedAt,
            StatusColor = journey.StatusColor
        };

        await _journeyRepository.AddAsync(newJourney, cancellationToken);
        await _journeyRepository.SaveChangesAsync(cancellationToken);

        foreach (var flow in OrderByDisplayOrder(journey.Flows))
        {
            await ImportFlowAsync(newJourney.Id, flow, requestedByUserId, warnings, strideIdMap, cancellationToken);
        }
    }

    /// <summary>Import a single flow and recursively import its child moments.</summary>
    /// <param name="journeyId">The parent journey ID.</param>
    /// <param name="flow">The exported flow data.</param>
    /// <param name="requestedByUserId">The requesting user ID for owner resolution.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="strideIdMap">Mapping of exported stride IDs to new stride IDs.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task ImportFlowAsync(
        int journeyId,
        ProjectExportFlow flow,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap,
        CancellationToken cancellationToken = default)
    {
        var nextSeq = await _context.GetNextFlowSequenceAsync(journeyId, cancellationToken);

        var newFlow = new Flow
        {
            JourneyId = journeyId,
            Statement = flow.Statement,
            Description = flow.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(flow.OwnerId, requestedByUserId, warnings, $"flow {flow.Id}", cancellationToken),
            SequenceNumber = nextSeq,
            DisplayOrder = flow.DisplayOrder,
            CreatedAt = flow.CreatedAt,
            UpdatedAt = flow.UpdatedAt,
            StatusColor = flow.StatusColor
        };

        await _flowRepository.AddAsync(newFlow, cancellationToken);
        await _flowRepository.SaveChangesAsync(cancellationToken);

        foreach (var moment in OrderByDisplayOrder(flow.Moments))
        {
            await ImportMomentAsync(newFlow.Id, moment, requestedByUserId, warnings, strideIdMap, cancellationToken);
        }
    }

    /// <summary>Import a single moment with its stride assignments and sub-tasks.</summary>
    /// <param name="flowId">The parent flow ID.</param>
    /// <param name="moment">The exported moment data.</param>
    /// <param name="requestedByUserId">The requesting user ID for owner resolution.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="strideIdMap">Mapping of exported stride IDs to new stride IDs.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task ImportMomentAsync(
        int flowId,
        ProjectExportMoment moment,
        int requestedByUserId,
        List<string> warnings,
        Dictionary<int, int> strideIdMap,
        CancellationToken cancellationToken = default)
    {
        var nextSeq = await _context.GetNextMomentSequenceAsync(flowId, cancellationToken);

        var newMoment = new Moment
        {
            FlowId = flowId,
            Statement = moment.Statement,
            Description = moment.Description,
            Type = moment.Type,
            Status = moment.Status,
            EffortEstimate = moment.EffortEstimate,
            OwnerId = await ResolveOptionalOwnerIdAsync(moment.OwnerId, requestedByUserId, warnings, $"moment {moment.Id}", cancellationToken),
            AssignedStrideId = await ResolveStrideIdAsync(moment.AssignedStrideId, strideIdMap, warnings, $"moment {moment.Id}", "assigned"),
            SequenceNumber = nextSeq,
            DisplayOrder = moment.DisplayOrder,
            CreatedAt = moment.CreatedAt,
            UpdatedAt = moment.UpdatedAt,
            CompletedAt = moment.CompletedAt,
            IsZombie = moment.IsZombie,
            OriginalStrideId = await ResolveStrideIdAsync(moment.OriginalStrideId, strideIdMap, warnings, $"moment {moment.Id}", "original"),
            StatusColor = moment.StatusColor
        };

        await _momentRepository.AddAsync(newMoment, cancellationToken);
        await _momentRepository.SaveChangesAsync(cancellationToken);

        foreach (var task in moment.Tasks.OrderBy(task => task.Id))
        {
            await ImportTaskAsync(newMoment.Id, task, requestedByUserId, warnings, cancellationToken);
        }
    }

    /// <summary>Import a single moment sub-task.</summary>
    /// <param name="momentId">The parent moment ID.</param>
    /// <param name="task">The exported task data.</param>
    /// <param name="requestedByUserId">The requesting user ID for owner resolution.</param>
    /// <param name="warnings">Accumulated import warnings.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    private async Task ImportTaskAsync(
        int momentId,
        ProjectExportMomentTask task,
        int requestedByUserId,
        List<string> warnings,
        CancellationToken cancellationToken = default)
    {
        var newTask = new MomentTask
        {
            MomentId = momentId,
            Name = task.Name,
            Description = task.Description,
            OwnerId = await ResolveOptionalOwnerIdAsync(task.OwnerId, requestedByUserId, warnings, $"task {task.Id}", cancellationToken),
            IsCompleted = task.IsCompleted,
            CreatedAt = task.CreatedAt,
            CompletedAt = task.CompletedAt
        };

        await _momentTaskRepository.AddAsync(newTask, cancellationToken);
        await _momentTaskRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Generate a URL-safe slug from a text string.</summary>
    /// <param name="text">The text to slugify.</param>
    /// <returns>A URL-safe slug.</returns>
    private static string Slugify(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "project";
        var slug = SlugInvalidChars.Replace(text.ToLowerInvariant(), "")
            .Replace(" ", "-")
            .Replace("--", "-")
            .Trim('-');
        return string.IsNullOrEmpty(slug) ? "project" : slug;
    }

    /// <summary>Execute an import operation within a database transaction.</summary>
    /// <param name="action">The import operation to execute.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The result of the import operation.</returns>
    private async Task<TResult> ExecuteInTransactionAsync<TResult>(Func<Task<TResult>> action, CancellationToken cancellationToken = default)
    {
        if (_context is DbContext dbContext)
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await action();
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        return await action();
    }
}
