using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PMO.Core.Models;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL;

/// <summary>
/// EF Core database context for the Promise Model Online domain. Manages
/// all entity DbSets, the entity-sequence allocator used for human-readable
/// numbering within each scope, and automatic audit-logging via a custom
/// <see cref="SaveChangesAsync"/> override that captures before/after
/// snapshots for every insert, update, and delete.
/// </summary>
/// <remarks>Initializes the context with explicit options and HTTP context accessor, used for testing or custom DI scenarios.</remarks>
/// <param name="options">The options to be used by the DbContext.</param>
/// <param name="httpContextAccessor">The HTTP context accessor for actor identification.</param>
public class PromiseModelOnlineContext(
    DbContextOptions<PromiseModelOnlineContext> options,
    IHttpContextAccessor httpContextAccessor) : DbContext(options), IPromiseModelOnlineContext
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    /// <summary>Initializes the context with the given options, using a default <see cref="HttpContextAccessor"/> for actor identification.</summary>
    /// <param name="options">The options to be used by the DbContext.</param>
    public PromiseModelOnlineContext(DbContextOptions<PromiseModelOnlineContext> options)
        : this(options, new HttpContextAccessor())
    {
    }

    /// <summary>
    /// Gets or sets the DbSet for promise records.
    /// </summary>
    public DbSet<Promise> Promises { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for epic records.
    /// </summary>
    public DbSet<Epic> Epics { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for journey records.
    /// </summary>
    public DbSet<Journey> Journeys { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for flow records.
    /// </summary>
    public DbSet<Flow> Flows { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for moment records.
    /// </summary>
    public DbSet<Moment> Moments { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for project records.
    /// </summary>
    public DbSet<Project> Projects { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for stride records.
    /// </summary>
    public DbSet<Stride> Strides { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for iteration records.
    /// </summary>
    public DbSet<Iteration> Iterations { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for user records.
    /// </summary>
    public DbSet<User> Users { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for reaction records.
    /// </summary>
    public DbSet<Reaction> Reactions { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for audit events.
    /// </summary>
    public DbSet<AuditEvent> AuditEvents { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for entity-scoped sequence counters.
    /// </summary>
    public DbSet<EntitySequence> EntitySequences { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for moment task records.
    /// </summary>
    public DbSet<MomentTask> MomentTasks { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for moment assignment records.
    /// </summary>
    public DbSet<MomentAssignment> MomentAssignments { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for bug/rework task records.
    /// </summary>
    public DbSet<BugReworkTask> BugReworkTasks { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for comment records.
    /// </summary>
    public DbSet<Comment> Comments { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for comment mention records.
    /// </summary>
    public DbSet<CommentMention> CommentMentions { get; set; } = null!;

    /// <summary>
    /// Gets or sets the DbSet for permission records.
    /// </summary>
    public DbSet<Permission> Permissions { get; set; } = null!;

    /// <summary>
    /// Atomically allocates the next sequence number for a given parent
    /// scope. Uses a serializable transaction on relational databases to
    /// prevent gaps or duplicates. For the in-memory provider, a simple
    /// find-and-update is used instead (transactions are not supported).
    /// </summary>
    /// <param name="parentId">The parent entity's ID that scopes the sequence.</param>
    /// <param name="scope">The entity type name acting as the sequence scope (e.g., "Promise", "Epic").</param>
    /// <returns>The next available sequence number.</returns>
    private async Task<int> GetNextSequenceAsync(int parentId, string scope)
    {
        if (Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
        {
            var seq = await EntitySequences.FindAsync(parentId, scope);
            if (seq is null)
            {
                EntitySequences.Add(new EntitySequence { ParentId = parentId, Scope = scope, NextSequenceNumber = 2 });
                await SaveChangesAsync();
                return 1;
            }
            var value = seq.NextSequenceNumber;
            seq.NextSequenceNumber++;
            await SaveChangesAsync();
            return value;
        }

        if (Database.CurrentTransaction is not null)
        {
            var seq = await EntitySequences.FindAsync(parentId, scope);
            if (seq is null)
            {
                EntitySequences.Add(new EntitySequence { ParentId = parentId, Scope = scope, NextSequenceNumber = 2 });
                await SaveChangesAsync();
                return 1;
            }
            var value = seq.NextSequenceNumber;
            seq.NextSequenceNumber++;
            await SaveChangesAsync();
            return value;
        }

        await using var tx = await Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var seq2 = await EntitySequences.FindAsync(parentId, scope);
        if (seq2 is null)
        {
            EntitySequences.Add(new EntitySequence { ParentId = parentId, Scope = scope, NextSequenceNumber = 2 });
            await SaveChangesAsync();
            await tx.CommitAsync();
            return 1;
        }
        var nextValue = seq2.NextSequenceNumber;
        seq2.NextSequenceNumber++;
        await SaveChangesAsync();
        await tx.CommitAsync();
        return nextValue;
    }

    /// <summary>Atomically allocate the next display-order sequence number for a product promise within its project.</summary>
    /// <param name="projectId">The parent project ID.</param>
    /// <returns>The next available sequence number.</returns>
    public async Task<int> GetNextPromiseSequenceAsync(int projectId)
        => await GetNextSequenceAsync(projectId, "Promise");

    /// <summary>Atomically allocate the next display-order sequence number for an epic within its parent promise.</summary>
    /// <param name="promiseId">The parent promise ID.</param>
    /// <returns>The next available sequence number.</returns>
    public async Task<int> GetNextEpicSequenceAsync(int promiseId)
        => await GetNextSequenceAsync(promiseId, "Epic");

    /// <summary>Atomically allocate the next display-order sequence number for a journey within its parent epic.</summary>
    /// <param name="epicId">The parent epic ID.</param>
    /// <returns>The next available sequence number.</returns>
    public async Task<int> GetNextJourneySequenceAsync(int epicId)
        => await GetNextSequenceAsync(epicId, "Journey");

    /// <summary>Atomically allocate the next display-order sequence number for a flow within its parent journey.</summary>
    /// <param name="journeyId">The parent journey ID.</param>
    /// <returns>The next available sequence number.</returns>
    public async Task<int> GetNextFlowSequenceAsync(int journeyId)
        => await GetNextSequenceAsync(journeyId, "Flow");

    /// <summary>Atomically allocate the next display-order sequence number for a moment within its parent flow.</summary>
    /// <param name="flowId">The parent flow ID.</param>
    /// <returns>The next available sequence number.</returns>
    public async Task<int> GetNextMomentSequenceAsync(int flowId)
        => await GetNextSequenceAsync(flowId, "Moment");

    /// <summary>Configure entity relationships, indexes, and constraints.</summary>
    /// <remarks>
    ///   Disables cascade delete globally (<see cref="DeleteBehavior.NoAction"/>), sets up
    ///   unique indexes on <see cref="User.Slug"/> and the composite
    ///   (<see cref="Project.OwnerId"/>, <see cref="Project.Slug"/>), and configures the
    ///   composite key on <see cref="EntitySequence"/>.
    /// </remarks>
    /// <param name="modelBuilder">The <see cref="ModelBuilder"/> used to configure the model.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.NoAction;
        }

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasIndex(e => new { e.OwnerId, e.Slug }).IsUnique();
        });

        modelBuilder.Entity<Moment>(entity =>
        {
            entity.HasIndex(e => new { e.FlowId, e.SequenceNumber }).IsUnique();
        });

        modelBuilder.Entity<EntitySequence>(entity =>
        {
            entity.HasKey(e => new { e.ParentId, e.Scope });
            entity.Property(e => e.ParentId).ValueGeneratedNever();
            entity.Property(e => e.Scope).HasMaxLength(50);
            entity.Property(e => e.NextSequenceNumber).HasDefaultValue(1);
        });
    }

    /// <summary>Save entity changes to the database with automatic audit logging.</summary>
    /// <remarks>
    ///   Overrides the default <see cref="DbContext.SaveChangesAsync(System.Threading.CancellationToken)"/>
    ///   to capture before/after snapshots for every insert, update, and delete.
    /// </remarks>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete.</param>
    /// <returns>The number of state entries written to the database.</returns>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => SaveChangesWithAuditAsync(cancellationToken);

    /// <summary>Save entity changes to the database with automatic audit logging.</summary>
    /// <remarks>Only the async path supports audit logging. The sync path throws to prevent accidental use.</remarks>
    public override int SaveChanges()
        => throw new NotSupportedException("Use SaveChangesAsync for audit logging support.");

    /// <summary>Save changes and automatically capture audit entries.</summary>
    /// <remarks>
    ///   When pending changes are detected, captures before/after snapshots, persists them as
    ///   <see cref="AuditEvent"/> records, and wraps the entire save + audit write in a
    ///   transaction when running against a relational database.
    /// </remarks>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The number of state entries written to the database.</returns>
    private async Task<int> SaveChangesWithAuditAsync(CancellationToken cancellationToken)
    {
        ChangeTracker.DetectChanges();

        var auditEntries = await BuildAuditEntriesAsync(cancellationToken);
        if (auditEntries.Count == 0)
        {
            return await base.SaveChangesAsync(cancellationToken);
        }

        var supportsTransactions = Database.IsRelational();
        var startedTransaction = supportsTransactions && Database.CurrentTransaction is null;
        if (startedTransaction)
        {
            await Database.BeginTransactionAsync(cancellationToken);
        }

        try
        {
            var result = await base.SaveChangesAsync(cancellationToken);

            AuditEvents.AddRange(await Task.WhenAll(auditEntries.Select(entry => entry.ToAuditEventAsync())));
            await base.SaveChangesAsync(cancellationToken);

            if (startedTransaction)
            {
                await Database.CommitTransactionAsync(cancellationToken);
            }

            return result;
        }
        catch
        {
            if (startedTransaction && Database.CurrentTransaction is not null)
            {
                await Database.RollbackTransactionAsync(cancellationToken);
            }

            throw;
        }
    }

    /// <summary>Inspect all tracked entities and build audit entry descriptors.</summary>
    /// <remarks>
    ///   Skips <see cref="AuditEvent"/> entities and tracks only Added, Modified, and Deleted
    ///   entries. Extracts actor identity from the current HTTP context.
    /// </remarks>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>A list of <see cref="AuditEntry"/> records capturing the change.</returns>
    private async Task<List<AuditEntry>> BuildAuditEntriesAsync(CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var entries = new List<AuditEntry>();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditEvent)
                continue;

            if (entry.State is not EntityState.Added and not EntityState.Modified and not EntityState.Deleted)
                continue;

            var actionType = ResolveActionType(entry);
            var beforeValues = entry.State == EntityState.Added
                ? new Dictionary<string, object?>()
                : Snapshot(entry.OriginalValues);
            var afterValues = entry.State == EntityState.Deleted
                ? new Dictionary<string, object?>()
                : Snapshot(entry.CurrentValues);

            var projectId = await ResolveProjectIdAsync(entry, cancellationToken);
            entries.Add(new AuditEntry(
                entry.Entity,
                actionType,
                entry.Metadata.ClrType.Name,
                beforeValues,
                afterValues,
                BuildChanges(beforeValues, afterValues),
                user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? user?.FindFirst("sub")?.Value,
                user?.FindFirst(ClaimTypes.Email)?.Value
                    ?? user?.FindFirst("email")?.Value,
                user?.Identity?.Name,
                projectId));
        }

        return entries;
    }

    /// <summary>Resolve the root project ID for a tracked entity.</summary>
    /// <remarks>
    ///   For entities that store the project ID directly (Project, Promise, Iteration) it is
    ///   read immediately. For others, the hierarchy is walked upward.
    /// </remarks>
    /// <param name="entry">The tracked entity entry.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The root project ID, or <c>null</c> if it cannot be resolved.</returns>
    private async Task<int?> ResolveProjectIdAsync(EntityEntry entry, CancellationToken cancellationToken) => entry.Entity switch
    {
        Project project => project.Id > 0 ? project.Id : null,
        Promise promise => promise.ProjectId,
        Epic epic => await ResolveProjectIdFromPromiseIdAsync(epic.ProductPromiseId, cancellationToken),
        Journey journey => await ResolveProjectIdFromEpicIdAsync(journey.EpicId, cancellationToken),
        Flow flow => await ResolveProjectIdFromJourneyIdAsync(flow.JourneyId, cancellationToken),
        Iteration iteration => iteration.ProjectId,
        Stride stride => stride.IterationId.HasValue
            ? await ResolveProjectIdFromIterationIdAsync(stride.IterationId.Value, cancellationToken)
            : null,
        Moment moment => await ResolveProjectIdFromFlowIdAsync(moment.FlowId, cancellationToken),
        _ => null
    };

    /// <summary>Resolve the project ID from a promise.</summary>
    /// <param name="promiseId">The promise ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The project ID, or <c>null</c> if not found.</returns>
    private async Task<int?> ResolveProjectIdFromPromiseIdAsync(int promiseId, CancellationToken cancellationToken)
    {
        if (promiseId <= 0)
            return null;

        return await Promises.AsNoTracking()
            .Where(promise => promise.Id == promiseId)
            .Select(promise => promise.ProjectId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>Resolve the project ID from an epic by walking up to its parent promise.</summary>
    /// <param name="epicId">The epic ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The project ID, or <c>null</c> if not found.</returns>
    private async Task<int?> ResolveProjectIdFromEpicIdAsync(int epicId, CancellationToken cancellationToken)
    {
        if (epicId <= 0)
            return null;

        var promiseId = await Epics.AsNoTracking()
            .Where(epic => epic.Id == epicId)
            .Select(epic => epic.ProductPromiseId)
            .FirstOrDefaultAsync(cancellationToken);

        return await ResolveProjectIdFromPromiseIdAsync(promiseId, cancellationToken);
    }

    /// <summary>Resolve the project ID from a journey by walking up to its parent epic.</summary>
    /// <param name="journeyId">The journey ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The project ID, or <c>null</c> if not found.</returns>
    private async Task<int?> ResolveProjectIdFromJourneyIdAsync(int journeyId, CancellationToken cancellationToken)
    {
        if (journeyId <= 0)
            return null;

        var epicId = await Journeys.AsNoTracking()
            .Where(journey => journey.Id == journeyId)
            .Select(journey => journey.EpicId)
            .FirstOrDefaultAsync(cancellationToken);

        return await ResolveProjectIdFromEpicIdAsync(epicId, cancellationToken);
    }

    /// <summary>Resolve the project ID from a flow by walking up to its parent journey.</summary>
    /// <param name="flowId">The flow ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The project ID, or <c>null</c> if not found.</returns>
    private async Task<int?> ResolveProjectIdFromFlowIdAsync(int flowId, CancellationToken cancellationToken)
    {
        if (flowId <= 0)
            return null;

        var journeyId = await Flows.AsNoTracking()
            .Where(flow => flow.Id == flowId)
            .Select(flow => flow.JourneyId)
            .FirstOrDefaultAsync(cancellationToken);

        return await ResolveProjectIdFromJourneyIdAsync(journeyId, cancellationToken);
    }

    /// <summary>Resolve the project ID from an iteration (stores project ID directly).</summary>
    /// <param name="iterationId">The iteration ID. Must be greater than zero.</param>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    /// <returns>The project ID, or <c>null</c> if not found.</returns>
    private async Task<int?> ResolveProjectIdFromIterationIdAsync(int iterationId, CancellationToken cancellationToken)
    {
        if (iterationId <= 0)
            return null;

        return await Iterations.AsNoTracking()
            .Where(iteration => iteration.Id == iterationId)
            .Select(iteration => iteration.ProjectId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>Determine the audit action type from the entity state.</summary>
    /// <remarks>
    ///   For <see cref="Moment"/> entities, a modification to the <c>Status</c> property is
    ///   classified as <see cref="AuditActionType.StatusChanged"/> rather than a generic
    ///   <see cref="AuditActionType.Updated"/>.
    /// </remarks>
    /// <param name="entry">The tracked entity entry.</param>
    /// <returns>The corresponding <see cref="AuditActionType"/>.</returns>
    private static AuditActionType ResolveActionType(EntityEntry entry)
    {
        if (entry.State == EntityState.Added)
            return AuditActionType.Created;

        if (entry.State == EntityState.Deleted)
            return AuditActionType.Deleted;

        if (entry.Metadata.ClrType == typeof(Moment) &&
            entry.Properties.Any(property => property.Metadata.Name == nameof(Moment.Status) && property.IsModified))
        {
            return AuditActionType.StatusChanged;
        }

        return AuditActionType.Updated;
    }

    /// <summary>Take a dictionary snapshot of EF Core property values for audit serialization.</summary>
    /// <param name="values">The <see cref="PropertyValues"/> from the change tracker.</param>
    /// <returns>A dictionary of property name to value.</returns>
    private static Dictionary<string, object?> Snapshot(PropertyValues values)
        => values.Properties.ToDictionary(property => property.Name, property => values[property]);

    /// <summary>Compare before/after snapshots and return only the changed properties.</summary>
    /// <param name="beforeValues">Property snapshot before the change.</param>
    /// <param name="afterValues">Property snapshot after the change.</param>
    /// <returns>A dictionary of changed property names to their before/after values.</returns>
    private static Dictionary<string, AuditEntry.AuditChange> BuildChanges(
        Dictionary<string, object?> beforeValues,
        Dictionary<string, object?> afterValues)
    {
        var changes = new Dictionary<string, AuditEntry.AuditChange>();

        foreach (var key in beforeValues.Keys.Union(afterValues.Keys))
        {
            beforeValues.TryGetValue(key, out var beforeValue);
            afterValues.TryGetValue(key, out var afterValue);

            if (!Equals(beforeValue, afterValue))
            {
                changes[key] = new AuditEntry.AuditChange(beforeValue, afterValue);
            }
        }

        return changes;
    }

    /// <summary>
    /// Internal record that captures the before/after state of a single
    /// tracked entity change, which is later materialized into a persisted
    /// <see cref="AuditEvent"/>.
    /// </summary>
    private sealed record AuditEntry(
        object Entity,
        AuditActionType ActionType,
        string EntityType,
        Dictionary<string, object?> BeforeValues,
        Dictionary<string, object?> AfterValues,
        Dictionary<string, AuditEntry.AuditChange> ChangedValues,
        string? ActorUserId,
        string? ActorEmail,
        string? ActorSubject,
        int? ProjectId)
    {
        /// <summary>Materialize this audit entry into a persistent <see cref="AuditEvent"/>.</summary>
        /// <returns>A fully populated <see cref="AuditEvent"/> ready for persistence.</returns>
        public async Task<AuditEvent> ToAuditEventAsync()
        {
            var projectId = ProjectId;

            if (projectId is null && Entity is Project project && project.Id > 0)
            {
                projectId = project.Id;
            }

            return new AuditEvent
            {
                OccurredAtUtc = DateTime.UtcNow,
                ActorUserId = ActorUserId,
                ActorEmail = ActorEmail,
                ActorSubject = ActorSubject,
                EntityType = EntityType,
                EntityId = ResolveEntityId(Entity),
                ProjectId = projectId,
                ActionType = ActionType.ToString(),
                BeforeJson = BeforeValues.Count == 0 ? null : JsonSerializer.Serialize(BeforeValues),
                AfterJson = AfterValues.Count == 0 ? null : JsonSerializer.Serialize(AfterValues),
                ChangesJson = ChangedValues.Count == 0 ? null : JsonSerializer.Serialize(ChangedValues)
            };
        }

        /// <summary>
        /// Represents a single changed property with its before and after value.
        /// </summary>
        public sealed record AuditChange(object? Before, object? After);

        /// <summary>Extract the integer ID from any entity with an <c>Id</c> property.</summary>
        /// <param name="entity">The entity to extract the ID from.</param>
        /// <returns>The integer ID, or <c>0</c> if not found.</returns>
        private static int ResolveEntityId(object entity)
        {
            var property = entity.GetType().GetProperty("Id", BindingFlags.Public | BindingFlags.Instance);
            var value = property?.GetValue(entity);
            return value is int id ? id : 0;
        }
    }
}
