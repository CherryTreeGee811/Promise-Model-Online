namespace PromiseModelOnline.Api.DTOs;

public class PromiseDTO
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
<<<<<<< HEAD
    public int ProjectId { get; set; }
    public int SequenceNumber { get; set; }
||||||| 1bedf4f
=======
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}