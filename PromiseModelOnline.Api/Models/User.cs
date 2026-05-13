using System.ComponentModel.DataAnnotations;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Models;
public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public UserRole Role { get; set; } = UserRole.Student;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastLoginAt { get; set; }
    
    // Navigation properties
    public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<MomentAssignment> MomentAssignments { get; set; } = new List<MomentAssignment>();
}