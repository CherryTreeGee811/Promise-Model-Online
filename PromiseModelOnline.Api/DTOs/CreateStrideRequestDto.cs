namespace PromiseModelOnline.Api.DTOs;

public class CreateStrideRequestDto
{
    public string Name { get; set; } = string.Empty;
    public int? IterationId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; } = 14;
    public bool IsActive { get; set; } = true;
}
