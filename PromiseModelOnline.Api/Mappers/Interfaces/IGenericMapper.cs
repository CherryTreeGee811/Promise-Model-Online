using PromiseModelOnline.Api.BusinessLogic.Interfaces;

namespace PromiseModelOnline.Api.Mappers.Interfaces;

/// <summary>Generic mapper interface for mapping between entity and DTO types.</summary>
/// <remarks>
///   Implementations use either convention-based property copying (<see cref="GenericMapper{TSource, TDestination}"/>)
///   or explicit mapping for complex types that require custom logic.
/// </remarks>
/// <typeparam name="TSource">The source entity type.</typeparam>
/// <typeparam name="TDestination">The destination DTO type.</typeparam>
public interface IGenericMapper<TSource, TDestination>
    where TSource : class
{
    /// <summary>Map a source entity to a destination DTO using the provided service for additional context.</summary>
    /// <param name="source">The source entity. Not null.</param>
    /// <param name="service">The generic service for business/data access logic, used for resolving related data.</param>
    /// <returns>The mapped destination DTO.</returns>
    TDestination Map(TSource source, IGenericService<TSource> service);
}
