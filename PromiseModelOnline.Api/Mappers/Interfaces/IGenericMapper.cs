using PromiseModelOnline.Api.BusinessLogic.Interfaces;

namespace PromiseModelOnline.Api.Mappers.Interfaces
{
    /// <summary>
    /// Generic mapper interface for mapping between types.
    /// </summary>
    /// <typeparam name="TSource">The source type.</typeparam>
    /// <typeparam name="TDestination">The destination type.</typeparam>
    public interface IGenericMapper<TSource, TDestination>
        where TSource : class
    {
        /// <summary>
        /// Maps an object of type <typeparamref name="TSource"/> to <typeparamref name="TDestination"/>, using the provided service.
        /// </summary>
        /// <param name="source">The source object.</param>
        /// <param name="service">The generic service for business/data access logic.</param>
        /// <returns>The mapped destination object.</returns>
        TDestination Map(TSource source, IGenericService<TSource> service);
    }
}