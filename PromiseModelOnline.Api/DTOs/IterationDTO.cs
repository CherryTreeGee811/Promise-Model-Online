using System;

namespace PromiseModelOnline.Api.DTOs;

public class IterationDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
}