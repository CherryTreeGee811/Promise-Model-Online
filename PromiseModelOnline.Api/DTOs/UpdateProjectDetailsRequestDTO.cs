namespace PromiseModelOnline.Api.DTOs;

public sealed class UpdateProjectDetailsRequestDTO
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}