namespace PromiseModelOnline.Api.DTOs;

public class CreateFlowRequestDTO
{
    public string Statement { get; set; } = string.Empty;
    public int JourneyId { get; set; }
    public int DisplayOrder { get; set; }
    public string? Description { get; set; }
}
