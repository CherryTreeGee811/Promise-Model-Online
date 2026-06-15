namespace PromiseModelOnline.Api.DTOs;

/// <summary>Request DTO for accepting a project invitation.</summary>
public class AcceptInvitationRequestDTO
{
    /// <summary>Foreign key to the <see cref="Models.Permission"/> record representing the invitation.</summary>
    public int PermissionId { get; set; }
}
