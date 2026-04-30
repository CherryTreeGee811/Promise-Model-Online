
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;

namespace PromiseModelOnline.Api.Mappers
{
    /// <summary>
    /// Generic mapper implementation for mapping between types.
    /// </summary>
    /// <typeparam name="TSource">The source type.</typeparam>
    /// <typeparam name="TDestination">The destination type.</typeparam>
    public class GenericMapper<TSource, TDestination> : IGenericMapper<TSource, TDestination>
        where TSource : class
        where TDestination : class, new()
    {
        /// <summary>
        /// Maps an object of type <typeparamref name="TSource"/> to <typeparamref name="TDestination"/>, using the provided service.
        /// </summary>
        /// <param name="source">The source object.</param>
        /// <param name="service">The generic service for business/data access logic.</param>
        /// <returns>The mapped destination object.</returns>
        public TDestination Map(TSource source, IGenericService<TSource> service)
        {
            var destination = new TDestination();
            // Example: Use the service for enrichment, validation, or lookups as needed
            // (This is a placeholder; customize as needed for your domain)
            var sourceProps = typeof(TSource).GetProperties();
            var destProps = typeof(TDestination).GetProperties();
            foreach (var sProp in sourceProps)
            {
                var dProp = System.Array.Find(destProps, p => p.Name == sProp.Name && p.PropertyType == sProp.PropertyType);
                if (dProp != null && dProp.CanWrite)
                {
                    dProp.SetValue(destination, sProp.GetValue(source));
                }
            }
            // Example: service can be used here for additional logic
            // e.g., service.GetByIdAsync(...), service.FindAsync(...), etc.
            return destination;
        }
    }
}