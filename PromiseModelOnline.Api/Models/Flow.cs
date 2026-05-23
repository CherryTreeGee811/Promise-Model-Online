using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class Flow
{
    [Key]
    public int Id { get; set; }

    [NotMapped]
    public string Type => "Flow";
        
    [Required]
    [MaxLength(500)]
    public string Statement { get; set; } = string.Empty;
        
    [MaxLength(2000)]
    public string? Description { get; set; }
        
    public int JourneyId { get; set; }
        
    public int? OwnerId { get; set; }
        
    public int DisplayOrder { get; set; } = 0;
        
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    public DateTime? UpdatedAt { get; set; }
        
    //TODO: Enum for glyph colours?
    [MaxLength(20)]
    public string StatusColor { get; set; } = "red"; // red, orange, black, green
        
    // Navigation properties
    [ForeignKey("JourneyId")]
    public Journey Journey { get; set; } = null!;
        
    [ForeignKey("OwnerId")]
    public User? Owner { get; set; }
        
    public ICollection<Moment> Moments { get; set; } = new List<Moment>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}