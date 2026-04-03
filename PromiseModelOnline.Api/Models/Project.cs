using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;
public class Project
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public int OwnerId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("OwnerId")]
    public User Owner { get; set; } = null!;
    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    public ICollection<Promise> ProductPromises { get; set; } = new List<Promise>();
    public ICollection<Stride> Strides { get; set; } = new List<Stride>();
}