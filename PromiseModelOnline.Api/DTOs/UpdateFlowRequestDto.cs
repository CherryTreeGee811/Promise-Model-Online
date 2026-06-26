using System.Text.Json.Serialization;

namespace PromiseModelOnline.Api.DTOs;

public class UpdateFlowRequestDto
{
    [JsonRequired]
    public int Id { get; set; }
    [JsonRequired]
    public string Statement { get; set; } = string.Empty;
    public string? Description { get; set; }
    [JsonRequired]
    public int JourneyId { get; set; }
    [JsonRequired]
    public int SequenceNumber { get; set; }
    [JsonRequired]
    public int DisplayOrder { get; set; }
    public string StatusColor { get; set; } = "red";
    public int? OwnerId { get; set; }
}
