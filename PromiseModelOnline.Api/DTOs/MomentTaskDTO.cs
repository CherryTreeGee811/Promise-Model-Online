namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="PMO.Core.Models.MomentTask"/> responses.</summary>
public class MomentTaskDTO
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    
    /// <summary>Task display name.</summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>Task description.</summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>Foreign key to the parent <see cref="Models.Moment"/>.</summary>
    public int MomentId { get; set; }
    
    /// <summary>Foreign key to the responsible <see cref="Models.User"/>, or <c>null</c>.</summary>
    public int? OwnerId { get; set; }
    
    /// <summary>Whether the task is marked complete.</summary>
    public bool IsCompleted { get; set; }
    
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>UTC timestamp when completed, or <c>null</c>.</summary>
    public DateTime? CompletedAt { get; set; }
}
