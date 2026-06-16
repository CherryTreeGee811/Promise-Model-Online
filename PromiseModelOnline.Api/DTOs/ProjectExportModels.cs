using PMO.Core.Models;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Portable document format for exporting and importing a project hierarchy.</summary>
public sealed class ProjectExportDocument
{
    [JsonPropertyName("schemaVersion")]
    /// <summary>Version identifier for the document format.</summary>
    public string SchemaVersion { get; set; } = "1.0";

    [JsonPropertyName("exportedAt")]
    /// <summary>UTC timestamp when the export was generated.</summary>
    public DateTime ExportedAt { get; set; }

    [JsonPropertyName("project")]
    /// <summary>The exported project data.</summary>
    public ProjectExportProject Project { get; set; } = new();
}

/// <summary>Exported project data within the export document.</summary>
public sealed class ProjectExportProject
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("name")]
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int OwnerId { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("productPromises")]
    /// <summary>Top-level promises in the project.</summary>
    public List<ProjectExportPromise> ProductPromises { get; set; } = new();

    [JsonPropertyName("iterations")]
    /// <summary>Iterations in the project.</summary>
    public List<ProjectExportIteration> Iterations { get; set; } = new();
}

/// <summary>Exported promise data within the project export document.</summary>
public sealed class ProjectExportPromise
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("projectId")]
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }

    [JsonPropertyName("statement")]
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("epics")]
    /// <summary>Child epics.</summary>
    public List<ProjectExportEpic> Epics { get; set; } = new();
}

/// <summary>Exported epic data within the project export document.</summary>
public sealed class ProjectExportEpic
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("productPromiseId")]
    /// <summary>Foreign key to the parent <see cref="Models.Promise"/>.</summary>
    public int ProductPromiseId { get; set; }

    [JsonPropertyName("statement")]
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("journeys")]
    /// <summary>Child journeys.</summary>
    public List<ProjectExportJourney> Journeys { get; set; } = new();
}

/// <summary>Exported journey data within the project export document.</summary>
public sealed class ProjectExportJourney
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("epicId")]
    /// <summary>Foreign key to the parent <see cref="Models.Epic"/>.</summary>
    public int EpicId { get; set; }

    [JsonPropertyName("statement")]
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("flows")]
    /// <summary>Child flows.</summary>
    public List<ProjectExportFlow> Flows { get; set; } = new();
}

/// <summary>Exported flow data within the project export document.</summary>
public sealed class ProjectExportFlow
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("journeyId")]
    /// <summary>Foreign key to the parent <see cref="Models.Journey"/>.</summary>
    public int JourneyId { get; set; }

    [JsonPropertyName("statement")]
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    [JsonPropertyName("displayOrder")]
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("statusColor")]
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("moments")]
    /// <summary>Child moments.</summary>
    public List<ProjectExportMoment> Moments { get; set; } = new();
}

/// <summary>Exported moment data within the project export document.</summary>
public sealed class ProjectExportMoment
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("flowId")]
    /// <summary>Foreign key to the parent <see cref="Models.Flow"/>.</summary>
    public int FlowId { get; set; }

    [JsonPropertyName("statement")]
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    [JsonPropertyName("type")]
    /// <summary>Entity type discriminator.</summary>
    public MomentType Type { get; set; }

    [JsonPropertyName("status")]
    /// <summary>Current workflow status.</summary>
    public MomentStatus Status { get; set; }

    [JsonPropertyName("effortEstimate")]
    /// <summary>Effort estimate using Fibonacci sizing, or <c>null</c>.</summary>
    public Estimate? EffortEstimate { get; set; }

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    [JsonPropertyName("assignedStrideId")]
    /// <summary>Foreign key to the assigned <see cref="Models.Stride"/>, or <c>null</c>.</summary>
    public int? AssignedStrideId { get; set; }

    [JsonPropertyName("displayOrder")]
    /// <summary>Sort order within the parent scope.</summary>
    public int DisplayOrder { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updatedAt")]
    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    [JsonPropertyName("completedAt")]
    /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("isZombie")]
    /// <summary>Indicates this entity was migrated from a previous stride.</summary>
    public bool IsZombie { get; set; }

    [JsonPropertyName("originalStrideId")]
    /// <summary>The stride this entity was originally assigned to before migration.</summary>
    public int? OriginalStrideId { get; set; }

    [JsonPropertyName("statusColor")]
    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = string.Empty;

    [JsonPropertyName("tasks")]
    /// <summary>Child task DTOs.</summary>
    public List<ProjectExportMomentTask> Tasks { get; set; } = new();
}

/// <summary>Exported moment sub-task data within the project export document.</summary>
public sealed class ProjectExportMomentTask
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("momentId")]
    /// <summary>Foreign key to the parent <see cref="Models.Moment"/>.</summary>
    public int MomentId { get; set; }

    [JsonPropertyName("name")]
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    /// <summary>Optional description.</summary>
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("ownerId")]
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    [JsonPropertyName("isCompleted")]
    /// <summary>Whether the task is marked complete.</summary>
    public bool IsCompleted { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("completedAt")]
    /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
    public DateTime? CompletedAt { get; set; }
}

/// <summary>Exported iteration data within the project export document.</summary>
public sealed class ProjectExportIteration
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("projectId")]
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }

    [JsonPropertyName("name")]
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("strides")]
    /// <summary>Child strides.</summary>
    public List<ProjectExportStride> Strides { get; set; } = new();
}

/// <summary>Exported stride data within the project export document.</summary>
public sealed class ProjectExportStride
{
    [JsonPropertyName("id")]
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    [JsonPropertyName("iterationId")]
    /// <summary>Foreign key to the parent <see cref="Models.Iteration"/>.</summary>
    public int? IterationId { get; set; }

    [JsonPropertyName("name")]
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("startDate")]
    /// <summary>Start date of the time-boxed period.</summary>
    public DateTime StartDate { get; set; }

    [JsonPropertyName("endDate")]
    /// <summary>End date of the time-boxed period.</summary>
    public DateTime EndDate { get; set; }

    [JsonPropertyName("durationDays")]
    /// <summary>Duration in days.</summary>
    public int DurationDays { get; set; }

    [JsonPropertyName("isActive")]
    /// <summary>Whether the entity is currently active.</summary>
    public bool IsActive { get; set; }

    [JsonPropertyName("createdAt")]
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("momentIds")]
    /// <summary>List of moment IDs assigned to this stride.</summary>
    public List<int> MomentIds { get; set; } = new();
}