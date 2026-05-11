using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>
    /// Generic service implementation that delegates data access to a repository.
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

        /// <inheritdoc/>
        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        /// <inheritdoc/>
        public async Task<T?> GetByIdAsync(object id)
        {
            return await _repository.GetByIdAsync(id);
        }

        /// <inheritdoc/>
        public async Task AddAsync(T entity)
        {
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
        }

        /// <inheritdoc/>
        public async Task UpdateAsync(T entity)
        {
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
        }

        /// <inheritdoc/>
        public async Task<bool> DeleteByIdAsync(object id)
        {
            return await _repository.DeleteByIdAsync(id);
        }
    }
}