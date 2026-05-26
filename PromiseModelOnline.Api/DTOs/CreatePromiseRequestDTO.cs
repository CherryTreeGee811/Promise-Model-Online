namespace PromiseModelOnline.Api.DTOs;

public class CreatePromiseRequestDTO
{
    public string Statement { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public int DisplayOrder { get; set; }
    public string? Description { get; set; }
}