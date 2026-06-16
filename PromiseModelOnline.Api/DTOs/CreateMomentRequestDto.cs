using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new moment.</summary>
public class CreateMomentRequestDto
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Flow"/>.</summary>
    [JsonRequired]
    public int FlowId { get; set; }
    /// <summary>Entity type discriminator.</summary>
    public MomentType Type { get; set; } = MomentType.Story;
    /// <summary>Current workflow status.</summary>
    public MomentStatus Status { get; set; } = MomentStatus.Todo;
    /// <summary>Effort estimate using Fibonacci sizing, or <c>null</c>.</summary>
    public Estimate? EffortEstimate { get; set; }
    /// <summary>Foreign key to the assigned <see cref="Models.Stride"/>, or <c>null</c>.</summary>
    public int? AssignedStrideId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    [JsonRequired]
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}