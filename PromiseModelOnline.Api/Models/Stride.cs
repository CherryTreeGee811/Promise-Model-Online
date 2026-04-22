using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class Stride
{
    [Key]
    public int Id { get; set; }
        
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
        
    public int ProjectId { get; set; }
        
    public DateTime StartDate { get; set; }
        
    public DateTime EndDate { get; set; }
        
    public int DurationDays { get; set; } = 14; // Default 2 weeks
        
    public bool IsActive { get; set; } = true;
        
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
    // Navigation properties
    [ForeignKey("ProjectId")]
    public Project Project { get; set; } = null!;
        
    public ICollection<Moment> Moments { get; set; } = new List<Moment>();
}