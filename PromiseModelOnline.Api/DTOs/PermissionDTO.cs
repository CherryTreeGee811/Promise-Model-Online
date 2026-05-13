namespace PromiseModelOnline.Api.DTOs;

public class PermissionDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
}