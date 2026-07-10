using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for creating a new stride within a project iteration.</summary>
public class CreateStrideRequestDto
{
    /// <summary>Display name of the stride.</summary>
    [JsonRequired, Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Foreign key to the parent iteration, or null for unassigned strides.</summary>
    public int? IterationId { get; set; }

    /// <summary>Start date of the sprint.</summary>
    [JsonRequired]
    public DateTime StartDate { get; set; }

    /// <summary>End date of the sprint.</summary>
    [JsonRequired]
    public DateTime EndDate { get; set; }

    /// <summary>Duration in days. Default 14 (two-week sprint).</summary>
    public int DurationDays { get; set; } = 14;

    /// <summary>Whether this stride is currently active.</summary>
    public bool IsActive { get; set; } = true;
}
