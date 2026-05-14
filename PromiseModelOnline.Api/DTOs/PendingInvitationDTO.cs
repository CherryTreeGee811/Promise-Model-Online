namespace PromiseModelOnline.Api.DTOs;

public class PendingInvitationDTO
{
    public int PermissionId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
}