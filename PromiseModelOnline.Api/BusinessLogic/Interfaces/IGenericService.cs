using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    /// <summary>Generic service interface for business-logic operations.</summary>
    /// <remarks>
    ///   Provides standard CRUD operations that delegate to the corresponding repository layer.
    ///   Implementations may compose additional business rules, validation, and cross-cutting
    ///   concerns (auditing, authorization, caching). Scoped lifetime.
    /// </remarks>
    /// <typeparam name="T">The entity type, constrained to <c>class</c>.</typeparam>
    public interface IGenericService<T> where T : class
    {
        /// <summary>Retrieve every entity of type <typeparamref name="T"/>.</summary>
        /// <returns>All entities. Empty if none exist.</returns>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>Find an entity by its primary-key value.</summary>
        /// <param name="id">The primary-key value. Supports <c>int</c>, <c>Guid</c>, <c>string</c>, or composite.</param>
        /// <returns>The matching entity, or <c>null</c> if not found.</returns>
        Task<T?> GetByIdAsync(object id);

        /// <summary>Stage a new entity for creation.</summary>
        /// <param name="entity">The entity to create. Not null.</param>
        /// <exception cref="ArgumentNullException"><paramref name="entity"/> is <c>null</c>.</exception>
        Task AddAsync(T entity);

        /// <summary>Update an existing entity.</summary>
        /// <param name="entity">The entity with updated property values. Not null.</param>
        /// <exception cref="ArgumentNullException"><paramref name="entity"/> is <c>null</c>.</exception>
        Task UpdateAsync(T entity);

        /// <summary>Delete an entity by its primary-key value.</summary>
        /// <param name="id">Primary-key value (<c>int</c>, <c>Guid</c>, <c>string</c>, or composite).</param>
        /// <returns><c>true</c> if found and deleted; <c>false</c> otherwise.</returns>
        Task<bool> DeleteByIdAsync(object id);
    }
}
