using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for updating an existing flow entity.</summary>
public class UpdateFlowRequestDto
{
    /// <summary>Primary key of the flow to update.</summary>
    [JsonRequired]
    public int Id { get; set; }

    /// <summary>Short description of the flow.</summary>
    [JsonRequired]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional longer description.</summary>
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent journey.</summary>
    [JsonRequired]
    public int JourneyId { get; set; }

    /// <summary>Sequence number within the parent scope.</summary>
    [JsonRequired]
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonRequired]
    public int DisplayOrder { get; set; }

    /// <summary>Status display color.</summary>
    public string StatusColor { get; set; } = "red";

    /// <summary>Foreign key to the responsible user, or null.</summary>
    public int? OwnerId { get; set; }
}
