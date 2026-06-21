namespace PromiseModelOnline.Api.DTOs;

/// <summary>Data transfer object for <see cref="Models.Permission"/> responses.</summary>
public class PermissionDto
{
    /// <summary>Primary key.</summary>
    public int Id { get; set; }
    /// <summary>Foreign key to the user.</summary>
    public int UserId { get; set; }
    /// <summary>Display name of the user.</summary>
    public string UserName { get; set; } = string.Empty;
    /// <summary>ID of the project.</summary>
    public int ProjectId { get; set; }
    /// <summary>Access level permission.</summary>
    public string Level { get; set; } = string.Empty;
    /// <summary>Current workflow status.</summary>
    public string Status { get; set; } = "Pending";
}
