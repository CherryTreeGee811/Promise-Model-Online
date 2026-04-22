using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class Promise
{
    [Key]
    public int Id { get; set; }
        
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
        
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    public int ProjectId { get; set; }
        
    public int? OwnerId { get; set; }
        
    public int DisplayOrder { get; set; } = 0;
        
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    public DateTime? UpdatedAt { get; set; }
        
    // Status tracking for glyph (red/orange/yellow/green)
    //TODO: Enum for glyph colours?
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red"; // red, orange, yellow, green
        
    // Navigation properties
    [ForeignKey("ProjectId")]
    public Project Project { get; set; } = null!;
        
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
        
    public ICollection<Epic> Epics { get; set; } = new List<Epic>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}