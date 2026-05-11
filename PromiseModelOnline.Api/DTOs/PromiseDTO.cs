namespace PromiseModelOnline.Api.DTOs;

public class PromiseDTO
{
    public int Id { get; set; }
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}