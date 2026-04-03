using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;

public class Notification
{
    [Key]
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    [Required]
    public NotificationType Type { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;
    
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(500)]
    public string? Link { get; set; }
    
    public bool IsEmailSent { get; set; } = false;
    
    public int? ReferenceId { get; set; }
    
    [MaxLength(50)]
    public string? ReferenceType { get; set; }
    
    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}