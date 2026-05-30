using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;

namespace PromiseModelOnline.Api.DAL
{
    /// <summary>
    /// Represents the database context for the Scientific Operations Centre,
    /// including the configuration of tables and initial records.
    /// </summary>
    /// <param name="options">The options to be used by the DbContext.</param>
    public class PromiseModelOnlineContext : DbContext, IPromiseModelOnlineContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PromiseModelOnlineContext(DbContextOptions<PromiseModelOnlineContext> options)
            : this(options, new HttpContextAccessor())
        {
        }

        public PromiseModelOnlineContext(
            DbContextOptions<PromiseModelOnlineContext> options,
            IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
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
        /// Configures the model and seeds initial data for the database.
        /// </summary>
        /// <param name="builder">The model builder used to configure the model.</param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // SQL Server disallows multiple cascade paths; keep all relationships as NO ACTION.
            foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                foreignKey.DeleteBehavior = DeleteBehavior.NoAction;
            }
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => SaveChangesWithAuditAsync(cancellationToken);

        public override int SaveChanges()
            => SaveChangesWithAuditAsync(CancellationToken.None).GetAwaiter().GetResult();

        private async Task<int> SaveChangesWithAuditAsync(CancellationToken cancellationToken)
        {
            ChangeTracker.DetectChanges();

            var auditEntries = await BuildAuditEntriesAsync(cancellationToken);
            if (auditEntries.Count == 0)
            {
                return await base.SaveChangesAsync(cancellationToken);
            }

            var startedTransaction = Database.CurrentTransaction is null;
            if (startedTransaction)
            {
                await Database.BeginTransactionAsync(cancellationToken);
            }

            try
            {
                var result = await base.SaveChangesAsync(cancellationToken);

                AuditEvents.AddRange(await Task.WhenAll(auditEntries.Select(entry => entry.ToAuditEventAsync(this, cancellationToken))));
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

        private async Task<int?> ResolveProjectIdAsync(EntityEntry entry, CancellationToken cancellationToken)
        {
            return entry.Entity switch
            {
                Project project => project.Id > 0 ? project.Id : null,
                Promise promise => promise.ProjectId,
                Epic epic => await ResolveProjectIdFromPromiseIdAsync(epic.ProductPromiseId, cancellationToken),
                Journey journey => await ResolveProjectIdFromEpicIdAsync(journey.EpicId, cancellationToken),
                Flow flow => await ResolveProjectIdFromJourneyIdAsync(flow.JourneyId, cancellationToken),
                Moment moment => await ResolveProjectIdFromFlowIdAsync(moment.FlowId, cancellationToken),
                _ => null
            };
        }

        private async Task<int?> ResolveProjectIdFromPromiseIdAsync(int promiseId, CancellationToken cancellationToken)
        {
            if (promiseId <= 0)
                return null;

            return await Promises.AsNoTracking()
                .Where(promise => promise.Id == promiseId)
                .Select(promise => promise.ProjectId)
                .FirstOrDefaultAsync(cancellationToken);
        }

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

        private static Dictionary<string, object?> Snapshot(PropertyValues values)
            => values.Properties.ToDictionary(property => property.Name, property => values[property]);

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
            public async Task<AuditEvent> ToAuditEventAsync(PromiseModelOnlineContext context, CancellationToken cancellationToken)
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

            public sealed record AuditChange(object? Before, object? After);

            private static int ResolveEntityId(object entity)
            {
                var property = entity.GetType().GetProperty("Id", BindingFlags.Public | BindingFlags.Instance);
                var value = property?.GetValue(entity);
                return value is int id ? id : 0;
            }
        }
    }
}