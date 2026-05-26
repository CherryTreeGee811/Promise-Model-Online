namespace PromiseModelOnline.Api.DTOs;

public class StrideDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? IterationId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}