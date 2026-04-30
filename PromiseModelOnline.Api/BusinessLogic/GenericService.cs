using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>
    /// Generic service implementation for business logic operations.
    /// </summary>
    /// <typeparam name="T">The entity type.</typeparam>
    public class GenericService<T> : IGenericService<T> where T : class
    {
        private readonly IGenericRepository<T> _repository;

        /// <summary>
        /// Initializes a new instance of the <see cref="GenericService{T}"/> class.
        /// </summary>
        /// <param name="repository">The generic repository instance.</param>
        public GenericService(IGenericRepository<T> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Asynchronously retrieves all entities of type T.
        /// </summary>
        /// <returns>A collection of all entities.</returns>
        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        /// <summary>
        /// Asynchronously retrieves an entity by its identifier.
        /// </summary>
        /// <param name="id">The identifier of the entity.</param>
        /// <returns>The entity if found; otherwise, null.</returns>
        public async Task<T?> GetByIdAsync(object id)
        {
            return await _repository.GetByIdAsync(id);
        }

        /// <summary>
        /// Asynchronously finds entities matching the given predicate.
        /// </summary>
        /// <param name="predicate">The filter expression.</param>
        /// <returns>A collection of matching entities.</returns>
        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _repository.FindAsync(predicate);
        }

        /// <summary>
        /// Asynchronously adds a new entity to the service and saves changes.
        /// </summary>
        /// <param name="entity">The entity to add.</param>
        public async Task AddAsync(T entity)
        {
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
        }

        /// <summary>
        /// Asynchronously updates an existing entity in the service and saves changes.
        /// </summary>
        /// <param name="entity">The entity to update.</param>
        public async Task UpdateAsync(T entity)
        {
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
        }

        /// <summary>
        /// Asynchronously removes an entity from the service and saves changes.
        /// </summary>
        /// <param name="entity">The entity to remove.</param>
        public async Task RemoveAsync(T entity)
        {
            _repository.Remove(entity);
            await _repository.SaveChangesAsync();
        }
    }
}