using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PromiseModelOnline.Api.Models;

namespace PMO.Core.Models
{
    /// <summary>A sub-task within a <see cref="Moment"/> for breaking down work.</summary>
    /// <remarks>
    ///   Provides granular tracking of individual items within a moment. Each task has a name,
    ///   description, optional owner, and completion state.
    /// </remarks>
    public class MomentTask
    {
        /// <summary>Primary key.</summary>
        [Key]
        public int Id { get; set; }

        /// <summary>Short name. Required, max 200 characters.</summary>
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        /// <summary>Detailed description. Required, max 500 characters.</summary>
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        /// <summary>Foreign key to the parent <see cref="Moment"/>.</summary>
        public int MomentId { get; set; }
        
        /// <summary>Foreign key to the responsible <see cref="User"/>, or <c>null</c>.</summary>
        public int? OwnerId { get; set; }
        
        /// <summary>Whether this task is completed.</summary>
        public bool IsCompleted { get; set; } = false;
        
        /// <summary>UTC timestamp of creation.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
        public DateTime? CompletedAt { get; set; }
        
        /// <summary>The parent moment.</summary>
        [ForeignKey("MomentId")]
        public Moment Moment { get; set; } = null!;
        
        /// <summary>The responsible user, if assigned.</summary>
        [ForeignKey("OwnerId")]
        public User? Owner { get; set; }
    }
}
