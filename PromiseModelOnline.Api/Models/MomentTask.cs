using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Models;

namespace PMO.Core.Models
{
    public class MomentTask
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public int MomentId { get; set; }
        
        public int? OwnerId { get; set; }
        
        public bool IsCompleted { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedAt { get; set; }
        
        // Navigation properties
        [ForeignKey("MomentId")]
        public Moment Moment { get; set; } = null!;
        
        [ForeignKey("OwnerId")]
        public User? Owner { get; set; }
    }
}