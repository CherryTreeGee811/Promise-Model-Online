namespace PromiseModelOnline.Api.DTOs;

public class EpicDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ProductPromiseId { get; set; }
    public int? OwnerId { get; set; }
<<<<<<< HEAD
    public int SequenceNumber { get; set; }
||||||| 1bedf4f
=======
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string StatusColor { get; set; } = "red";
}