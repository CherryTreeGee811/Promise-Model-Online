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
        
    public int? IterationId { get; set; }

    public DateTime StartDate { get; set; }
        
    public DateTime EndDate { get; set; }
        
    public int DurationDays { get; set; } = 14;
        
    public bool IsActive { get; set; } = true;
        
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [ForeignKey(nameof(IterationId))]
    public Iteration? Iteration { get; set; }

    public ICollection<Moment> Moments { get; set; } = new List<Moment>();
}