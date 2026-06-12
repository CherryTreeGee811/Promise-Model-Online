using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

public sealed class ProjectImportValidationService : IProjectImportValidationService
{
    private const string ExpectedSchemaVersion = "1.0";

    public async Task<ProjectImportValidationResult> ValidateAsync(Stream jsonStream)
    {
        var result = new ProjectImportValidationResult();

        ProjectExportDocument? document;
        try
        {
            document = await JsonSerializer.DeserializeAsync<ProjectExportDocument>(
                jsonStream,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
        }
        catch (JsonException ex)
        {
            result.Errors.Add($"Malformed JSON: {ex.Message}");
            return result;
        }

        if (document is null)
        {
            result.Errors.Add("Import file could not be parsed.");
            return result;
        }

        result.Document = document;

        if (!string.Equals(document.SchemaVersion, ExpectedSchemaVersion, StringComparison.Ordinal))
        {
            result.Errors.Add($"Unsupported schema version '{document.SchemaVersion}'. Expected '{ExpectedSchemaVersion}'.");
        }

        if (document.Project is null)
        {
            result.Errors.Add("Project section is missing.");
            return result;
        }

        ValidateHierarchy(document, result);
        return result;
    }

    private static void ValidateHierarchy(ProjectExportDocument document, ProjectImportValidationResult result)
    {
        var project = document.Project;
        CollectIds(project.ProductPromises, result, "promise");
        CollectIds(project.Iterations, result, "iteration");

        foreach (var promise in project.ProductPromises)
        {
            if (promise.ProjectId != project.Id)
            {
                result.Errors.Add($"Promise {promise.Id} references project {promise.ProjectId}, but the root project id is {project.Id}.");
            }

            CollectIds(promise.Epics, result, $"epics for promise {promise.Id}");
            foreach (var epic in promise.Epics)
            {
                if (epic.ProductPromiseId != promise.Id)
                {
                    result.Errors.Add($"Epic {epic.Id} references promise {epic.ProductPromiseId}, but it is nested under promise {promise.Id}.");
                }

                CollectIds(epic.Journeys, result, $"journeys for epic {epic.Id}");
                foreach (var journey in epic.Journeys)
                {
                    if (journey.EpicId != epic.Id)
                    {
                        result.Errors.Add($"Journey {journey.Id} references epic {journey.EpicId}, but it is nested under epic {epic.Id}.");
                    }

                    CollectIds(journey.Flows, result, $"flows for journey {journey.Id}");
                    foreach (var flow in journey.Flows)
                    {
                        if (flow.JourneyId != journey.Id)
                        {
                            result.Errors.Add($"Flow {flow.Id} references journey {flow.JourneyId}, but it is nested under journey {journey.Id}.");
                        }

                        CollectIds(flow.Moments, result, $"moments for flow {flow.Id}");
                        foreach (var moment in flow.Moments)
                        {
                            if (moment.FlowId != flow.Id)
                            {
                                result.Errors.Add($"Moment {moment.Id} references flow {moment.FlowId}, but it is nested under flow {flow.Id}.");
                            }

                            if (moment.AssignedStrideId.HasValue && !StrideExists(project, moment.AssignedStrideId.Value))
                            {
                                result.Warnings.Add($"Moment {moment.Id} references assigned stride {moment.AssignedStrideId.Value}, but that stride was not found in the import file.");
                            }

                            if (moment.OriginalStrideId.HasValue && !StrideExists(project, moment.OriginalStrideId.Value))
                            {
                                result.Warnings.Add($"Moment {moment.Id} references original stride {moment.OriginalStrideId.Value}, but that stride was not found in the import file.");
                            }

                            foreach (var task in moment.Tasks)
                            {
                                if (task.MomentId != moment.Id)
                                {
                                    result.Errors.Add($"Task {task.Id} references moment {task.MomentId}, but it is nested under moment {moment.Id}.");
                                }
                            }
                        }
                    }
                }
            }
        }

        foreach (var iteration in project.Iterations)
        {
            if (iteration.ProjectId != project.Id)
            {
                result.Errors.Add($"Iteration {iteration.Id} references project {iteration.ProjectId}, but the root project id is {project.Id}.");
            }

            CollectIds(iteration.Strides, result, $"strides for iteration {iteration.Id}");
            foreach (var stride in iteration.Strides)
            {
                if (stride.IterationId.HasValue && stride.IterationId.Value != iteration.Id)
                {
                    result.Errors.Add($"Stride {stride.Id} references iteration {stride.IterationId.Value}, but it is nested under iteration {iteration.Id}.");
                }

                foreach (var momentId in stride.MomentIds)
                {
                    if (!MomentExists(project, momentId))
                    {
                        result.Warnings.Add($"Stride {stride.Id} references moment {momentId}, but that moment was not found in the import file.");
                    }
                }
            }
        }
    }

    private static HashSet<int> CollectIds<T>(IEnumerable<T> items, ProjectImportValidationResult result, string label) where T : class
    {
        var ids = new HashSet<int>();
        foreach (var item in items)
        {
            var id = GetId(item);
            if (!ids.Add(id))
            {
                result.Errors.Add($"Duplicate {label} id '{id}' found in the import file.");
            }
        }

        return ids;
    }

    private static bool StrideExists(ProjectExportProject project, int strideId)
    {
        return project.Iterations.Any(iteration => iteration.Strides.Any(stride => stride.Id == strideId));
    }

    private static bool MomentExists(ProjectExportProject project, int momentId)
    {
        return project.ProductPromises
            .SelectMany(promise => promise.Epics)
            .SelectMany(epic => epic.Journeys)
            .SelectMany(journey => journey.Flows)
            .SelectMany(flow => flow.Moments)
            .Any(moment => moment.Id == momentId);
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