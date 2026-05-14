namespace PromiseModelOnline.Api.DTOs;

public class CreateReactionRequest
{
    public string Emote { get; set; } = string.Empty;
    public string StackItemType { get; set; } = string.Empty;
    public int StackItemId { get; set; }
}