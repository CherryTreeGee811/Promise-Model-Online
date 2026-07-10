using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for updating an existing product promise entity.</summary>
public class UpdatePromiseRequestDto
{
    /// <summary>Primary key of the promise to update.</summary>
    [JsonRequired]
    public int Id { get; set; }

    /// <summary>Short description of the promise.</summary>
    [JsonRequired, MaxLength(500)]
    public string Statement { get; set; } = string.Empty;

    /// <summary>Optional longer description.</summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>Foreign key to the parent project.</summary>
    [JsonRequired]
    public int ProjectId { get; set; }

    /// <summary>Sequence number within the parent scope.</summary>
    [JsonRequired]
    public int SequenceNumber { get; set; }

    /// <summary>Sort order within the parent scope.</summary>
    [JsonRequired]
    public int DisplayOrder { get; set; }

    /// <summary>Status display color.</summary>
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red";

    /// <summary>Foreign key to the responsible user, or null.</summary>
    public int? OwnerId { get; set; }
}
