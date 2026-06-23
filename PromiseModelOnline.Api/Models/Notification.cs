using System.ComponentModel.DataAnnotations;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

/// <summary>An alert or message delivered to a user about events in their projects.</summary>
/// <remarks>
///   Notifications track their read state and whether an email was sent. They contain a
///   <see cref="Link"/> for navigation and optional <see cref="ReferenceId"/> / <see cref="ReferenceType"/>
///   for deep linking to the source entity. Delivered in real-time via SignalR.
/// </remarks>
public class Notification
{
    /// <summary>Primary key.</summary>
    [Key]
    public int Id { get; set; }

    /// <summary>Foreign key to the recipient <see cref="User"/>.</summary>
    public int UserId { get; set; }

    /// <summary>The notification category.</summary>
    public NotificationType Type { get; set; }

    /// <summary>Display message text.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Whether the user has dismissed this notification.</summary>
    public bool IsRead { get; set; }

    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Optional navigation URL.</summary>
    public string? Link { get; set; }

    /// <summary>Whether a corresponding email has been sent.</summary>
    public bool IsEmailSent { get; set; }

    /// <summary>Optional ID of the referenced entity.</summary>
    public int? ReferenceId { get; set; }

    /// <summary>Optional type name of the referenced entity.</summary>
    public string? ReferenceType { get; set; }
}
