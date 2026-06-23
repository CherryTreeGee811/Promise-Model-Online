using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic;

/// <summary>Generic service implementation that delegates CRUD operations to a repository.</summary>
/// <remarks>
///   Write operations (<see cref="AddAsync"/>, <see cref="UpdateAsync"/>, <see cref="DeleteByIdAsync"/>)
///   persist changes immediately via <see cref="IGenericRepository{T}.SaveChangesAsync"/>.
///   Scoped lifetime. Derived services override virtual methods to inject business rules.
/// </remarks>
/// <typeparam name="T">The entity type, constrained to <c>class</c>.</typeparam>
/// <remarks>Initializes the service with a repository.</remarks>
/// <param name="repository">The generic repository instance.</param>
public class GenericService<T>(IGenericRepository<T> repository) : IGenericService<T> where T : class
{
    private readonly IGenericRepository<T> _repository = repository;

    /// <summary>Retrieve every entity of type <typeparamref name="T"/> via the repository.</summary>
    /// <returns>All entities. Empty if none exist.</returns>
    public async Task<IEnumerable<T>> GetAllAsync() => await _repository.GetAllAsync();

    /// <summary>Find an entity by its primary-key value via the repository.</summary>
    /// <param name="id">The primary-key value. Supports <c>int</c>, <c>Guid</c>, <c>string</c>, or composite.</param>
    /// <returns>The matching entity, or <c>null</c> if not found.</returns>
    public async Task<T?> GetByIdAsync(object id) => await _repository.GetByIdAsync(id);

    /// <summary>Stage a new entity for creation and persist changes.</summary>
    /// <param name="entity">The entity to create. Not null.</param>
    /// <exception cref="ArgumentNullException"><paramref name="entity"/> is <c>null</c>.</exception>
    public virtual async Task AddAsync(T entity)
    {
        await _repository.AddAsync(entity);
        await _repository.SaveChangesAsync();
    }

    /// <summary>Update an existing entity and persist changes.</summary>
    /// <param name="entity">The entity with updated property values. Not null.</param>
    /// <exception cref="ArgumentNullException"><paramref name="entity"/> is <c>null</c>.</exception>
    public virtual async Task UpdateAsync(T entity)
    {
        _repository.Update(entity);
        await _repository.SaveChangesAsync();
    }

    /// <summary>Delete an entity by its primary-key value via the repository.</summary>
    /// <param name="id">Primary-key value (<c>int</c>, <c>Guid</c>, <c>string</c>, or composite).</param>
    /// <returns><c>true</c> if found and deleted; <c>false</c> otherwise.</returns>
    public virtual async Task<bool> DeleteByIdAsync(object id) => await _repository.DeleteByIdAsync(id);
}
