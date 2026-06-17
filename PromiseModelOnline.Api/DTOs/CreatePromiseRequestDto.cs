using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for creating a new promise.</summary>
public class CreatePromiseRequestDto
{
    /// <summary>Short description of the entity.</summary>
    public string Statement { get; set; } = string.Empty;
    /// <summary>ID of the project.</summary>
    [JsonRequired]
    public int ProjectId { get; set; }
    /// <summary>Sort order within the parent scope.</summary>
    [JsonRequired]
    public int DisplayOrder { get; set; }
    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}