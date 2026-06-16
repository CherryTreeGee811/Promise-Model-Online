using PMO.Core.Models;
using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Portable document format for exporting and importing a project hierarchy.</summary>
public sealed class ProjectExportDocument
{
    /// <summary>Version identifier for the document format.</summary>
    [JsonPropertyName("schemaVersion")]
    public string SchemaVersion { get; set; } = "1.0";

    /// <summary>UTC timestamp when the export was generated.</summary>
    [JsonPropertyName("exportedAt")]
    public DateTime ExportedAt { get; set; }

    /// <summary>The exported project data.</summary>
    [JsonPropertyName("project")]
    public ProjectExportProject Project { get; set; } = new();
}

/// <summary>Exported project data within the export document.</summary>
public sealed class ProjectExportProject
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Display name.</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int OwnerId { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>Top-level promises in the project.</summary>
    [JsonPropertyName("productPromises")]
    public List<ProjectExportPromise> ProductPromises { get; set; } = new();

    /// <summary>Iterations in the project.</summary>
    [JsonPropertyName("iterations")]
    public List<ProjectExportIteration> Iterations { get; set; } = new();
}

/// <summary>Exported promise data within the project export document.</summary>
public sealed class ProjectExportPromise
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>ID of the project.</summary>
    [JsonPropertyName("projectId")]
    public int ProjectId { get; set; }

    /// <summary>Short description of the entity.</summary>
    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Status display color.</summary>
    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    /// <summary>Child epics.</summary>
    [JsonPropertyName("epics")]
    public List<ProjectExportEpic> Epics { get; set; } = new();
}

/// <summary>Exported epic data within the project export document.</summary>
public sealed class ProjectExportEpic
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Promise"/>.</summary>
    [JsonPropertyName("productPromiseId")]
    public int ProductPromiseId { get; set; }

    /// <summary>Short description of the entity.</summary>
    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Status display color.</summary>
    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    /// <summary>Child journeys.</summary>
    [JsonPropertyName("journeys")]
    public List<ProjectExportJourney> Journeys { get; set; } = new();
}

/// <summary>Exported journey data within the project export document.</summary>
public sealed class ProjectExportJourney
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Epic"/>.</summary>
    [JsonPropertyName("epicId")]
    public int EpicId { get; set; }

    /// <summary>Short description of the entity.</summary>
    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Status display color.</summary>
    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    /// <summary>Child flows.</summary>
    [JsonPropertyName("flows")]
    public List<ProjectExportFlow> Flows { get; set; } = new();
}

/// <summary>Exported flow data within the project export document.</summary>
public sealed class ProjectExportFlow
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Journey"/>.</summary>
    [JsonPropertyName("journeyId")]
    public int JourneyId { get; set; }

    /// <summary>Short description of the entity.</summary>
    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Status display color.</summary>
    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    /// <summary>Child moments.</summary>
    [JsonPropertyName("moments")]
    public List<ProjectExportMoment> Moments { get; set; } = new();
}

/// <summary>Exported moment data within the project export document.</summary>
public sealed class ProjectExportMoment
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Flow"/>.</summary>
    [JsonPropertyName("flowId")]
    public int FlowId { get; set; }

    /// <summary>Short description of the entity.</summary>
    [JsonPropertyName("statement")]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Entity type discriminator.</summary>
    [JsonPropertyName("type")]
    public MomentType Type { get; set; }

    /// <summary>Current workflow status.</summary>
    [JsonPropertyName("status")]
    public MomentStatus Status { get; set; }

    /// <summary>Effort estimate using Fibonacci sizing, or <c>null</c>.</summary>
    [JsonPropertyName("effortEstimate")]
    public Estimate? EffortEstimate { get; set; }

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    /// <summary>Foreign key to the assigned <see cref="Models.Stride"/>, or <c>null</c>.</summary>
    [JsonPropertyName("assignedStrideId")]
    public int? AssignedStrideId { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    [JsonPropertyName("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }

    /// <summary>Indicates this entity was migrated from a previous stride.</summary>
    [JsonPropertyName("isZombie")]
    public bool IsZombie { get; set; }

    /// <summary>The stride this entity was originally assigned to before migration.</summary>
    [JsonPropertyName("originalStrideId")]
    public int? OriginalStrideId { get; set; }

    /// <summary>Status display color.</summary>
    [JsonPropertyName("statusColor")]
    public string StatusColor { get; set; } = string.Empty;

    /// <summary>Child task DTOs.</summary>
    [JsonPropertyName("tasks")]
    public List<ProjectExportMomentTask> Tasks { get; set; } = new();
}

/// <summary>Exported moment sub-task data within the project export document.</summary>
public sealed class ProjectExportMomentTask
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Moment"/>.</summary>
    [JsonPropertyName("momentId")]
    public int MomentId { get; set; }

    /// <summary>Display name.</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    [JsonPropertyName("ownerId")]
    public int? OwnerId { get; set; }

    /// <summary>Whether the task is marked complete.</summary>
    [JsonPropertyName("isCompleted")]
    public bool IsCompleted { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }
}

/// <summary>Exported iteration data within the project export document.</summary>
public sealed class ProjectExportIteration
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>ID of the project.</summary>
    [JsonPropertyName("projectId")]
    public int ProjectId { get; set; }

    /// <summary>Display name.</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>Child strides.</summary>
    [JsonPropertyName("strides")]
    public List<ProjectExportStride> Strides { get; set; } = new();
}

/// <summary>Exported stride data within the project export document.</summary>
public sealed class ProjectExportStride
{
    /// <summary>Primary key.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Foreign key to the parent <see cref="Models.Iteration"/>.</summary>
    [JsonPropertyName("iterationId")]
    public int? IterationId { get; set; }

    /// <summary>Display name.</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>Start date of the time-boxed period.</summary>
    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    /// <summary>End date of the time-boxed period.</summary>
    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    /// <summary>Duration in days.</summary>
    [JsonPropertyName("durationDays")]
    public int DurationDays { get; set; }

    /// <summary>Whether the entity is currently active.</summary>
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    /// <summary>List of moment IDs assigned to this stride.</summary>
    [JsonPropertyName("momentIds")]
    public List<int> MomentIds { get; set; } = new();
}