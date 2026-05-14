using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PromiseModelOnline.Api.Models;

public class Reaction
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Emote { get; set; } = string.Empty;   // e.g. "👍", "👎", "❤️", "😀", etc.

    [Required]
    [MaxLength(20)]
    public string StackItemType { get; set; } = string.Empty;  // "Promise","Epic","Journey","Flow","Moment"

    [Required]
    public int StackItemId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}