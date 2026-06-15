namespace PromiseModelOnline.Api.DTOs;

/// <summary>A single data point for an iteration burndown chart.</summary>
public class BurndownPointDTO
{
    /// <summary>Calendar date for the data point.</summary>
    public DateTime Date { get; set; }
    
    /// <summary>Remaining effort estimate in numeric units.</summary>
    public int RemainingEffort { get; set; }
    
    /// <summary>Ideal remaining effort along the burndown line.</summary>
    public int IdealRemaining { get; set; }
}
