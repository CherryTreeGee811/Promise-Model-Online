using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

public class UpdatePromiseRequestDto
{
    [JsonRequired]
    public int Id { get; set; }
    [JsonRequired]
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    [JsonRequired]
    public int ProjectId { get; set; }
    [JsonRequired]
    public int SequenceNumber { get; set; }
    [JsonRequired]
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public int? OwnerId { get; set; }
}
