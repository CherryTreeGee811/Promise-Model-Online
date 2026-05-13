using System.ComponentModel.DataAnnotations;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

public class Notification
{
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Link { get; set; }
    public bool IsEmailSent { get; set; }
    public int? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
}