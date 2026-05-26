using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class Epic
{
    
    [Key]
    public int Id { get; set; }

    [NotMapped]
    public string Type => "Epic";
        
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
        
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    public int ProductPromiseId { get; set; }
        
    public int? OwnerId { get; set; }
        
    public int DisplayOrder { get; set; } = 0;
        
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    public DateTime? UpdatedAt { get; set; }
        
    //TODO: Enum for glyph colours?
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red"; // red, orange, black, green
        
    // Navigation properties
    [ForeignKey("ProductPromiseId")]
    public Promise ProductPromise { get; set; } = null!;
        
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
        
    public ICollection<Journey> Journeys { get; set; } = new List<Journey>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}