namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for project member information.</summary>
public class ProjectMemberDTO
{
    /// <summary>Foreign key to the user.</summary>
    public int UserId { get; set; }
    /// <summary>Display name of the user.</summary>
    public string UserName { get; set; } = string.Empty;
    /// <summary>Email address.</summary>
    public string Email { get; set; } = string.Empty;
}