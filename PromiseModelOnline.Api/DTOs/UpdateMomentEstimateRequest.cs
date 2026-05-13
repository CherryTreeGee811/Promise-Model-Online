using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.DTOs;

public class UpdateMomentEstimateRequest
{
    public Estimate? Estimate { get; set; }
}