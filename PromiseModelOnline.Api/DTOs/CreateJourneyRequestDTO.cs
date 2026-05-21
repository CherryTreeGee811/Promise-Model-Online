namespace PromiseModelOnline.Api.DTOs;

public class CreateJourneyRequestDTO
{
    public string Statement { get; set; } = string.Empty;
    public int EpicId { get; set; }
    public int DisplayOrder { get; set; }
    public string? Description { get; set; }
}
