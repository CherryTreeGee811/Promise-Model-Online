namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Notification"/> responses.</summary>
public class NotificationDTO
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    
    /// <summary>Notification message text.</summary>
    public string Message { get; set; } = string.Empty;
    /// <summary>Entity type discriminator.</summary>
    public string Type { get; set; } = string.Empty;
    /// <summary>Whether the notification has been read by the user.</summary>
    public bool IsRead { get; set; }
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
    /// <summary>Optional navigation URL.</summary>
    public string? Link { get; set; }
}