using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for adding a reaction to a stack item.</summary>
public class CreateReactionRequest
{
    /// <summary>Emoji reaction string.</summary>
    [Required, MaxLength(20)]
    public string Emote { get; set; } = string.Empty;
    /// <summary>Type discriminator for the target entity.</summary>
    [Required, MaxLength(20)]
    public string StackItemType { get; set; } = string.Empty;
    /// <summary>Foreign key to the target entity.</summary>
    [JsonRequired]
    public int StackItemId { get; set; }
}
