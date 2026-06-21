namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for pending project invitations.</summary>
public class PendingInvitationDto
{
    /// <summary>Foreign key to the <see cref="Models.Permission"/>.</summary>
    public int PermissionId { get; set; }
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }
    /// <summary>Name of the project.</summary>
    public string ProjectName { get; set; } = string.Empty;
    /// <summary>Access level permission.</summary>
    public string Level { get; set; } = string.Empty;
    /// <summary>Current workflow status.</summary>
    public string Status { get; set; } = "Pending";
}
