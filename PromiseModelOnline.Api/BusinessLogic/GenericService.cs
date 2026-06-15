using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Generic service implementation that delegates CRUD operations to a repository.</summary>
    /// <remarks>
    ///   Write operations (<see cref="AddAsync"/>, <see cref="UpdateAsync"/>, <see cref="DeleteByIdAsync"/>)
    ///   persist changes immediately via <see cref="IGenericRepository{T}.SaveChangesAsync"/>.
    ///   Scoped lifetime. Derived services override virtual methods to inject business rules.
    /// </remarks>
    /// <typeparam name="T">The entity type, constrained to <c>class</c>.</typeparam>
    public class GenericService<T> : IGenericService<T> where T : class
    {
        private readonly IGenericRepository<T> _repository;

        /// <summary>Initializes the service with a repository.</summary>
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
        public virtual async Task AddAsync(T entity)
        {
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
        }

        /// <inheritdoc/>
        public virtual async Task UpdateAsync(T entity)
        {
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
        }

        /// <inheritdoc/>
        public virtual async Task<bool> DeleteByIdAsync(object id)
        {
            return await _repository.DeleteByIdAsync(id);
        }
    }
}