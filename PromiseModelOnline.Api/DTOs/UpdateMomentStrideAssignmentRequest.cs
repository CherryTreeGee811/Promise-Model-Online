namespace PromiseModelOnline.Api.DTOs;

/// <summary>
/// Request body for changing a moment's stride assignment.
/// Set <see cref="StrideId"/> to null to move the moment back to the backlog.
/// </summary>
public class UpdateMomentStrideAssignmentRequest
{
    public int? StrideId { get; set; }
}