using System.Data;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL.Interfaces;

/// <summary>Defines the contract for the Promise Model Online EF Core database context.</summary>
/// <remarks>
///   Exposes all entity <see cref="DbSet{T}"/> properties and the atomic sequence-number
///   allocators used for human-readable numbering within each hierarchy scope.
/// </remarks>
public interface IPromiseModelOnlineContext
{
    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Promise"/> records.</summary>
    DbSet<Promise> Promises { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Epic"/> records.</summary>
    DbSet<Epic> Epics { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Journey"/> records.</summary>
    DbSet<Journey> Journeys { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Flow"/> records.</summary>
    DbSet<Flow> Flows { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Moment"/> records.</summary>
    DbSet<Moment> Moments { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Project"/> records.</summary>
    DbSet<Project> Projects { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Stride"/> records.</summary>
    DbSet<Stride> Strides { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Iteration"/> records.</summary>
    DbSet<Iteration> Iterations { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="User"/> records.</summary>
    DbSet<User> Users { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for <see cref="Reaction"/> records.</summary>
    DbSet<Reaction> Reactions { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for audit event records.</summary>
    DbSet<AuditEvent> AuditEvents { get; set; }

    /// <summary>Gets or sets the <see cref="DbSet{T}"/> for entity-scoped sequence counters.</summary>
    DbSet<EntitySequence> EntitySequences { get; set; }

    /// <summary>Provides access to a <see cref="DbSet{T}"/> for the given entity type.</summary>
    /// <typeparam name="T">The entity type.</typeparam>
    /// <returns>The <see cref="DbSet{T}"/> for the given type.</returns>
    DbSet<T> Set<T>() where T : class;

    /// <summary>Atomically allocate the next sequence number for a promise within its project.</summary>
    /// <param name="projectId">The parent project ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The next available sequence number.</returns>
    Task<int> GetNextPromiseSequenceAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>Atomically allocate the next sequence number for an epic within its promise.</summary>
    /// <param name="promiseId">The parent promise ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The next available sequence number.</returns>
    Task<int> GetNextEpicSequenceAsync(int promiseId, CancellationToken cancellationToken = default);

    /// <summary>Atomically allocate the next sequence number for a journey within its epic.</summary>
    /// <param name="epicId">The parent epic ID. Must be greater than zero.</param>
    /// <returns>The next available sequence number.</returns>
    Task<int> GetNextJourneySequenceAsync(int epicId, CancellationToken cancellationToken = default);

    /// <summary>Atomically allocate the next sequence number for a flow within its journey.</summary>
    /// <param name="journeyId">The parent journey ID. Must be greater than zero.</param>
    /// <returns>The next available sequence number.</returns>
    Task<int> GetNextFlowSequenceAsync(int journeyId, CancellationToken cancellationToken = default);

    /// <summary>Atomically allocate the next sequence number for a moment within its flow.</summary>
    /// <param name="flowId">The parent flow ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The next available sequence number.</returns>
    Task<int> GetNextMomentSequenceAsync(int flowId, CancellationToken cancellationToken = default);
}
