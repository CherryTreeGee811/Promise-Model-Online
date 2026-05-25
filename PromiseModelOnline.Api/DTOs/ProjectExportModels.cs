using PMO.Core.Models;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

public sealed class ProjectExportDocument
{
    [JsonPropertyName("schemaVersion")]
    public string SchemaVersion { get; set; } = "1.0";

    [JsonPropertyName("exportedAt")]
    public DateTime ExportedAt { get; set; }

    [JsonPropertyName("project")]
    public ProjectExportProject Project { get; set; } = new();
}

public sealed class ProjectExportProject
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    public int OwnerId { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("productPromises")]
    public List<ProjectExportPromise> ProductPromises { get; set; } = new();

    [JsonPropertyName("iterations")]
    public List<ProjectExportIteration> Iterations { get; set; } = new();
}

public sealed class ProjectExportPromise
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("projectId")]
    public int ProjectId { get; set; }

    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("epics")]
    public List<ProjectExportEpic> Epics { get; set; } = new();
}

public sealed class ProjectExportEpic
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("productPromiseId")]
    public int ProductPromiseId { get; set; }

    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("journeys")]
    public List<ProjectExportJourney> Journeys { get; set; } = new();
}

public sealed class ProjectExportJourney
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("epicId")]
    public int EpicId { get; set; }

    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("flows")]
    public List<ProjectExportFlow> Flows { get; set; } = new();
}

public sealed class ProjectExportFlow
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("journeyId")]
    public int JourneyId { get; set; }

    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("moments")]
    public List<ProjectExportMoment> Moments { get; set; } = new();
}

public sealed class ProjectExportMoment
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("flowId")]
    public int FlowId { get; set; }

    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("type")]
    public MomentType Type { get; set; }

    [JsonPropertyName("status")]
    public MomentStatus Status { get; set; }

    [JsonPropertyName("effortEstimate")]
    public Estimate? EffortEstimate { get; set; }

    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    [JsonPropertyName("assignedStrideId")]
    public int? AssignedStrideId { get; set; }

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("isZombie")]
    public bool IsZombie { get; set; }

    [JsonPropertyName("originalStrideId")]
    public int? OriginalStrideId { get; set; }

    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("tasks")]
    public List<ProjectExportMomentTask> Tasks { get; set; } = new();
}

public sealed class ProjectExportMomentTask
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("momentId")]
    public int MomentId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    [JsonPropertyName("isCompleted")]
    public bool IsCompleted { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }
}

public sealed class ProjectExportIteration
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("projectId")]
    public int ProjectId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("strides")]
    public List<ProjectExportStride> Strides { get; set; } = new();
}

public sealed class ProjectExportStride
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("iterationId")]
    public int? IterationId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    [JsonPropertyName("durationDays")]
    public int DurationDays { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("momentIds")]
    public List<int> MomentIds { get; set; } = new();
}