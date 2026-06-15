namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Stride"/> responses.</summary>
public class StrideDTO
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Display name.</summary>
    public string Name { get; set; } = string.Empty;
    /// <summary>Foreign key to the parent <see cref="Models.Iteration"/>.</summary>
    public int? IterationId { get; set; }
    /// <summary>Start date of the time-boxed period.</summary>
    public DateTime StartDate { get; set; }
    /// <summary>End date of the time-boxed period.</summary>
    public DateTime EndDate { get; set; }
    /// <summary>Duration in days.</summary>
    public int DurationDays { get; set; }
    /// <summary>Whether the entity is currently active.</summary>
    public bool IsActive { get; set; }
    /// <summary>UTC timestamp of creation.</summary>
    public DateTime CreatedAt { get; set; }
}