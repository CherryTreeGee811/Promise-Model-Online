using System;

namespace PromiseModelOnline.Api.DTOs;

public class BurndownPointDTO
{
    public DateTime Date { get; set; }
    public int RemainingEffort { get; set; }
    public int IdealRemaining { get; set; }
}