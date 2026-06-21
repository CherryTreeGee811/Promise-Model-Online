using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Graph representation of a project's hierarchy for visualization.</summary>
public class ProjectGraphDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL-safe slug.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the owner <see cref="Models.User"/>.</summary>
    public int OwnerId { get; set; }

    /// <summary>Slug of the owner user.</summary>
    public string OwnerSlug { get; set; } = string.Empty;

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Child promise nodes in the graph.</summary>
    public List<PromiseGraphDto> Promises { get; set; } = new();
}

/// <summary>Graph node representing a <see cref="Models.Promise"/> within the project hierarchy.</summary>
public class PromiseGraphDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Entity type discriminator.</summary>
    public string Type { get; set; } = "Promise";

    /// <summary>Short description.</summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent project.</summary>
    public int ProjectId { get; set; }

    /// <summary>Foreign key to the responsible user, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    /// <summary>Human-readable sequence number within the project.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the project.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Child epic nodes in the graph.</summary>
    public List<EpicGraphDto> Epics { get; set; } = new();
}

/// <summary>Graph node representing an <see cref="Models.Epic"/> within the hierarchy.</summary>
public class EpicGraphDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Entity type discriminator.</summary>
    public string Type { get; set; } = "Epic";

    /// <summary>Short description.</summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent promise.</summary>
    public int ProductPromiseId { get; set; }

    /// <summary>Foreign key to the responsible user, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    /// <summary>Human-readable sequence number within the parent promise.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent promise.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Child journey nodes in the graph.</summary>
    public List<JourneyGraphDto> Journeys { get; set; } = new();
}

/// <summary>Graph node representing a <see cref="Models.Journey"/> within the hierarchy.</summary>
public class JourneyGraphDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Entity type discriminator.</summary>
    public string Type { get; set; } = "Journey";

    /// <summary>Short description.</summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent epic.</summary>
    public int EpicId { get; set; }

    /// <summary>Foreign key to the responsible user, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    /// <summary>Human-readable sequence number within the parent epic.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent epic.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Child flow nodes in the graph.</summary>
    public List<FlowGraphDto> Flows { get; set; } = new();
}

/// <summary>Graph node representing a <see cref="Models.Flow"/> within the hierarchy.</summary>
public class FlowGraphDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }

    /// <summary>Entity type discriminator.</summary>
    public string Type { get; set; } = "Flow";

    /// <summary>Short description.</summary>
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent journey.</summary>
    public int JourneyId { get; set; }

    /// <summary>Foreign key to the responsible user, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }

    /// <summary>Human-readable sequence number within the parent journey.</summary>
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent journey.</summary>
    public int DisplayOrder { get; set; }

    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC timestamp of last update, or <c>null</c>.</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Child moment nodes in the graph.</summary>
    public List<MomentDto> Moments { get; set; } = new();
}
