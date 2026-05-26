using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>
    /// Generic service interface for business‑logic operations.
    /// </summary>
    /// <typeparam name="T">The entity type.</typeparam>
    public interface IGenericService<T> where T : class
    {
        /// <summary>
        /// Asynchronously retrieves all entities of type T.
        /// </summary>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>
        /// Asynchronously retrieves an entity by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the entity.</param>
        Task<T?> GetByIdAsync(object id);

        /// <summary>
        /// Asynchronously adds a new entity.
        /// </summary>
        /// <param name="entity">The entity to add.</param>
        Task AddAsync(T entity);

        /// <summary>
        /// Asynchronously updates an existing entity.
        /// </summary>
        /// <param name="entity">The entity to update.</param>
        Task UpdateAsync(T entity);

        /// <summary>
        /// Asynchronously deletes an entity by its primary key.
        /// Returns true if the entity was found and deleted, otherwise false.
        /// </summary>
        /// <param name="id">The primary key of the entity.</param>
        Task<bool> DeleteByIdAsync(object id);
    }
}