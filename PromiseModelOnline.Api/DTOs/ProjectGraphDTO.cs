using PromiseModelOnline.Api.Enums;
using System;
using System.Collections.Generic;

namespace PromiseModelOnline.Api.DTOs;

public class ProjectGraphDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OwnerId { get; set; }
    public string OwnerSlug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<PromiseGraphDTO> Promises { get; set; } = new();
}

public class PromiseGraphDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = "Promise";
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ProjectId { get; set; }
    public int? OwnerId { get; set; }
    public int SequenceNumber { get; set; }
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<EpicGraphDTO> Epics { get; set; } = new();
}

public class EpicGraphDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = "Epic";
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ProductPromiseId { get; set; }
    public int? OwnerId { get; set; }
    public int SequenceNumber { get; set; }
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<JourneyGraphDTO> Journeys { get; set; } = new();
}

public class JourneyGraphDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = "Journey";
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int EpicId { get; set; }
    public int? OwnerId { get; set; }
    public int SequenceNumber { get; set; }
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<FlowGraphDTO> Flows { get; set; } = new();
}

public class FlowGraphDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = "Flow";
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int JourneyId { get; set; }
    public int? OwnerId { get; set; }
    public int SequenceNumber { get; set; }
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<MomentDTO> Moments { get; set; } = new();
}
