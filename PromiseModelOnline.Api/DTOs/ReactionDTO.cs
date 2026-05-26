namespace PromiseModelOnline.Api.DTOs;

public class ReactionDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Emote { get; set; } = string.Empty;
    public string StackItemType { get; set; } = string.Empty;
    public int StackItemId { get; set; }
    public DateTime CreatedAt { get; set; }
}