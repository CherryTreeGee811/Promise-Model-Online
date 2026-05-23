namespace PromiseModelOnline.Api.DTOs;

public class EpicDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ProductPromiseId { get; set; }
    public int? OwnerId { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string StatusColor { get; set; } = "red";
}