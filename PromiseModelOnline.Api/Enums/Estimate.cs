namespace PromiseModelOnline.Api.Enums;

/// <summary>Effort estimate using Fibonacci-like sizing for agile planning.</summary>
/// <remarks>
///   Mapped to numeric values for burndown calculation: XS=1, S=2, M=3, L=5, XL=8, XXL=13, XXXL=21.
///   Used by <c>Moment.EffortEstimate</c> and <c>GetTotalEffortForPromiseAsync</c>.
/// </remarks>
public enum Estimate
{
    /// <summary>Extra small (1 unit).</summary>
    XS,
    /// <summary>Small (2 units).</summary>
    S,
    /// <summary>Medium (3 units).</summary>
    M,
    /// <summary>Large (5 units).</summary>
    L,
    /// <summary>Extra large (8 units).</summary>
    XL,
    /// <summary>Double extra large (13 units).</summary>
    XXL,
    /// <summary>Triple extra large (21 units).</summary>
    XXXL
}
