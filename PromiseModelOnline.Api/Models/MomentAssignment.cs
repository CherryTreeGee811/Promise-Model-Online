using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class MomentAssignment
{
    [Key]
    public int Id { get; set; }
        
    public int MomentId { get; set; }
        
    public int UserId { get; set; }
        
    [MaxLength(50)]
    public string? Role { get; set; }
        
    [ForeignKey("MomentId")]
    public Moment Moment { get; set; } = null!;
        
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}