using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

public class CreatePermissionRequestDTO
{
    public string Email { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public PermissionLevel Level { get; set; }
}