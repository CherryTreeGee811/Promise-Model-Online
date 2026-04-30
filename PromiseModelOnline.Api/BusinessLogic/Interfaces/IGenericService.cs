using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>
    /// Generic service interface for business logic operations.
    /// </summary>
    /// <typeparam name="T">The entity type.</typeparam>
    /// <summary>
    /// Generic service interface for business logic operations.
    /// </summary>
    /// <typeparam name="T">The entity type.</typeparam>
    public interface IGenericService<T> where T : class
    {
        /// <summary>
        /// Asynchronously retrieves all entities of type T.
        /// </summary>
        /// <returns>A collection of all entities.</returns>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>
        /// Asynchronously retrieves an entity by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the entity.</param>
        /// <returns>The entity if found; otherwise, null.</returns>
        Task<T?> GetByIdAsync(object id);

        /// <summary>
        /// Asynchronously finds entities matching the given predicate.
        /// </summary>
        /// <param name="predicate">The filter expression.</param>
        /// <returns>A collection of matching entities.</returns>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// Asynchronously adds a new entity to the service.
        /// </summary>
        /// <param name="entity">The entity to add.</param>
        Task AddAsync(T entity);

        /// <summary>
        /// Asynchronously updates an existing entity in the service.
        /// </summary>
        /// <param name="entity">The entity to update.</param>
        Task UpdateAsync(T entity);

        /// <summary>
        /// Asynchronously removes an entity from the service.
        /// </summary>
        /// <param name="entity">The entity to remove.</param>
        Task RemoveAsync(T entity);
    }
}