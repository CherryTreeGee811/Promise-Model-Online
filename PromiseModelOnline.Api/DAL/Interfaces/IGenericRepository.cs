using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Defines standard CRUD operations for any entity type.</summary>
/// <remarks>
///   Implementations delegate to EF Core's <see cref="Microsoft.EntityFrameworkCore.DbSet{T}"/> 
///   and may compose additional query logic (filtering, eager-loading, soft-delete). 
///   All write methods stage changes in the change tracker; call 
///   <see cref="SaveChangesAsync"/> to persist. Thread-safe only when a single 
///   thread uses a scoped <see cref="Microsoft.EntityFrameworkCore.DbContext"/> instance.
/// </remarks>
/// <typeparam name="T">Entity type, constrained to <c>class</c>.</typeparam>
public interface IGenericRepository<T> where T : class
{
    /// <summary>Retrieve every entity of type <typeparamref name="T"/>.</summary>
    /// <remarks>Materialises the entire <see cref="Microsoft.EntityFrameworkCore.DbSet{T}"/> 
    /// with no filtering. For large tables, prefer a paginated or filtered query.</remarks>
    /// <returns>All entities currently tracked or persisted.</returns>
    Task<IEnumerable<T>> GetAllAsync();

    /// <summary>Find an entity by its primary-key value.</summary>
    /// <remarks>
    ///   Uses <see cref="Microsoft.EntityFrameworkCore.DbSet{T}.FindAsync(System.Object[])"/>,
    ///   which checks the change tracker before hitting the database. The 
    ///   <paramref name="id"/> parameter is <c>object</c> to support composite 
    ///   keys via anonymous types.
    /// </remarks>
    /// <param name="id">Primary-key value. Must be the same type as the entity's key 
    ///   property (<c>int</c>, <c>Guid</c>, <c>string</c>, or anonymous object).</param>
    /// <returns>The matching entity, or <c>null</c> if none exists.</returns>
    /// <exception cref="InvalidOperationException">The entity is already being tracked 
    ///   with a different key value.</exception>
    Task<T?> GetByIdAsync(object id);

    /// <summary>Stage a new entity for insertion.</summary>
    /// <remarks>
    ///   Calls <see cref="Microsoft.EntityFrameworkCore.DbSet{T}.AddAsync(T, System.Threading.CancellationToken)"/> 
    ///   to begin tracking the entity in the <c>Added</c> state. Persist via 
    ///   <see cref="SaveChangesAsync"/>. If the entity has an auto-generated key, 
    ///   EF assigns it after the save.
    /// </remarks>
    /// <param name="entity">The entity instance to add. Must not be <c>null</c>.</param>
    /// <exception cref="ArgumentNullException"><paramref name="entity"/> is <c>null</c>.</exception>
    Task AddAsync(T entity);

    /// <summary>Mark an existing entity as modified.</summary>
    /// <remarks>
    ///   Calls <see cref="Microsoft.EntityFrameworkCore.DbSet{T}.Update(T)"/> to set 
    ///   the entity's state to <c>Modified</c>. All properties are sent to the 
    ///   database on the next save, even if unchanged. Use a DTO + AutoMapper 
    ///   for partial updates.
    /// </remarks>
    /// <param name="entity">The entity with updated property values. Must be tracked 
    ///   or attached. Not null.</param>
    void Update(T entity);

    /// <summary>Remove an entity by its primary-key value.</summary>
    /// <remarks>
    ///   Looks up the entity first; returns <c>false</c> if not found. On success, 
    ///   marks it <c>Deleted</c> and persists immediately via 
    ///   <see cref="SaveChangesAsync"/>. For known stack types (Project, Promise, 
    ///   Epic, etc.) the delete cascades recursively through dependents.
    /// </remarks>
    /// <param name="id">Primary-key value (<c>int</c>, <c>Guid</c>, <c>string</c>, 
    ///   or composite).</param>
    /// <returns><c>true</c> if the entity was found and deleted; <c>false</c> if 
    ///   no entity with the given key exists.</returns>
    /// <exception cref="Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException">
    ///   The entity was modified or deleted between the lookup and the save.</exception>
    Task<bool> DeleteByIdAsync(object id);

    /// <summary>Persist all staged changes to the database.</summary>
    /// <remarks>
    ///   Delegates to <see cref="Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(System.Threading.CancellationToken)"/>. 
    ///   Applies all tracked inserts, updates, and deletes in a single transaction 
    ///   (if the provider supports it).
    /// </remarks>
    /// <exception cref="Microsoft.EntityFrameworkCore.DbUpdateException">
    ///   A database constraint is violated.</exception>
    Task SaveChangesAsync();
}
