namespace PromiseModelOnline.Api.DTOs;

public class FlowDTO
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int JourneyId { get; set; }
    public int? OwnerId { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string StatusColor { get; set; } = "red";
}