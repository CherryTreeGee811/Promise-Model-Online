namespace PromiseModelOnline.Api.DTOs;

public class CreateEpicRequestDTO
{
    public string Statement { get; set; } = string.Empty;
    public int ProductPromiseId { get; set; }
    public int DisplayOrder { get; set; }
    public string? Description { get; set; }
}
