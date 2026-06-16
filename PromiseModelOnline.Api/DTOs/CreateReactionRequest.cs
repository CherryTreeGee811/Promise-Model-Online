using System.ComponentModel.DataAnnotations;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for adding a reaction to a stack item.</summary>
public class CreateReactionRequest
{
    /// <summary>Emoji reaction string.</summary>
    public string Emote { get; set; } = string.Empty;
    /// <summary>Type discriminator for the target entity.</summary>
    public string StackItemType { get; set; } = string.Empty;
    /// <summary>Foreign key to the target entity.</summary>
    [Required]
    public int StackItemId { get; set; }
}