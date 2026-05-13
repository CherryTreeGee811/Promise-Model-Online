using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Request body for changing a moment's status.
/// </summary>
public class UpdateMomentStatusRequest
{
    public MomentStatus NewStatus { get; set; }
}