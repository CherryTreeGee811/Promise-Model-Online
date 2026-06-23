namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Reaction"/> responses.</summary>
public class ReactionDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Foreign key to the user.</summary>
    public int UserId { get; set; }
    /// <summary>Display name of the user.</summary>
    public string UserName { get; set; } = string.Empty;
    /// <summary>Emoji reaction string.</summary>
    public string Emote { get; set; } = string.Empty;
    /// <summary>Type discriminator for the target entity.</summary>
    public string StackItemType { get; set; } = string.Empty;
    /// <summary>Foreign key to the target entity.</summary>
    public int StackItemId { get; set; }
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
}
