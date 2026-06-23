using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PMO.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>Generic EF Core repository providing standard CRUD operations for any entity type.</summary>
/// <remarks>
///   All write methods stage changes in the change tracker; call <see cref="SaveChangesAsync"/>
///   to persist. Delete operations cascade through the full promise-model hierarchy
///   (Project -> Promise -> Epic -> Journey -> Flow -> Moment) when the entity is one of
///   the known stack types. Thread-safe only when a single thread uses a scoped
///   <see cref="DbContext"/> instance. Scoped lifetime.
/// </remarks>
/// <typeparam name="T">Entity type, constrained to <c>class</c>.</typeparam>
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    /// <summary>The EF Core database context.</summary>
    protected readonly PromiseModelOnlineContext _context;

    /// <summary>The <see cref="DbSet{T}"/> for the entity type.</summary>
    protected readonly DbSet<T> _dbSet;

    /// <summary>Initializes the repository backed by the given database context.</summary>
    /// <param name="context">The EF Core database context. Not null.</param>
    public GenericRepository(PromiseModelOnlineContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    /// <summary>Retrieve every entity of type <typeparamref name="T"/> from the database.</summary>
    /// <remarks>Materialises the entire DbSet with no filtering. For large tables, prefer a paginated or filtered query.</remarks>
    /// <returns>All entities currently tracked or persisted.</returns>
    public async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.ToListAsync();

    /// <summary>Find a single entity by its primary-key value using the change tracker.</summary>
    /// <remarks>
    ///   Uses <see cref="DbSet{T}.FindAsync(System.Object[])"/>, which checks the change tracker
    ///   before hitting the database. The <paramref name="id"/> parameter is <c>object</c> to
    ///   support composite keys via anonymous types.
    /// </remarks>
    /// <param name="id">Primary-key value. Must match the entity's key property type (<c>int</c>, <c>Guid</c>, <c>string</c>, or anonymous object).</param>
    /// <returns>The matching entity, or <c>null</c> if none exists.</returns>
    /// <exception cref="InvalidOperationException">The entity is already being tracked with a different key value.</exception>
    public async Task<T?> GetByIdAsync(object id)
        => await _dbSet.FindAsync(id);

    /// <summary>Filter entities matching the given predicate using a WHERE clause.</summary>
    /// <remarks>
    ///   Intended for use by derived repository classes. Materialises all matches in memory.
    /// </remarks>
    /// <param name="predicate">The filter expression. Not null.</param>
    /// <returns>Entities matching the predicate.</returns>
    protected async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.Where(predicate).ToListAsync();

    /// <summary>Stage a new entity for insertion into the database.</summary>
    /// <remarks>
    ///   Calls <see cref="DbSet{T}.AddAsync(T, System.Threading.CancellationToken)"/> to begin
    ///   tracking the entity in the <c>Added</c> state. Persist via <see cref="SaveChangesAsync"/>.
    /// </remarks>
    /// <param name="entity">The entity instance to add. Not null.</param>
    /// <exception cref="ArgumentNullException"><paramref name="entity"/> is <c>null</c>.</exception>
    public async Task AddAsync(T entity)
        => await _dbSet.AddAsync(entity);

    /// <summary>Mark an existing entity as modified.</summary>
    /// <remarks>
    ///   Calls <see cref="DbSet{T}.Update(T)"/> to set the entity's state to <c>Modified</c>.
    ///   All properties are sent to the database on the next save, even if unchanged. Use a
    ///   DTO + AutoMapper for partial updates.
    /// </remarks>
    /// <param name="entity">The entity with updated property values. Must be tracked or attached. Not null.</param>
    public void Update(T entity)
        => _dbSet.Update(entity);

    /// <summary>Remove an entity by its primary-key value, cascading through dependents for known stack types.</summary>
    /// <remarks>
    ///   Looks up the entity first; returns <c>false</c> if not found. On success, marks it
    ///   <c>Deleted</c> and persists immediately. For known stack types (Project, Promise,
    ///   Epic, etc.) the delete cascades recursively through all children.
    /// </remarks>
    /// <param name="id">Primary-key value (<c>int</c>, <c>Guid</c>, <c>string</c>, or composite).</param>
    /// <returns><c>true</c> if the entity was found and deleted; <c>false</c> if no entity with the given key exists.</returns>
    /// <exception cref="Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException">The entity was modified or deleted between the lookup and the save.</exception>
    public async Task<bool> DeleteByIdAsync(object id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity == null) return false;

        await RemoveWithDependentsAsync(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>Dispatch to the type-specific recursive removal method based on the runtime type of the entity.</summary>
    /// <param name="entity">The entity to remove. Not null.</param>
    private async Task RemoveWithDependentsAsync(object entity)
    {
        switch (entity)
        {
            case Project project:
                await RemoveProjectAsync(project);
                return;
            case Promise promise:
                await RemovePromiseAsync(promise);
                return;
            case Epic epic:
                await RemoveEpicAsync(epic);
                return;
            case Journey journey:
                await RemoveJourneyAsync(journey);
                return;
            case Flow flow:
                await RemoveFlowAsync(flow);
                return;
            case Moment moment:
                await RemoveMomentAsync(moment);
                return;
            case Comment comment:
                await RemoveCommentAsync(comment);
                return;
            default:
                _context.Remove(entity);
                return;
        }
    }

    /// <summary>Delete a project along with all its product promises, iterations, strides, and permission records.</summary>
    /// <param name="project">The project to delete.</param>
    private async Task RemoveProjectAsync(Project project)
    {
        var promises = await _context.Set<Promise>()
            .Where(promise => promise.ProjectId == project.Id)
            .ToListAsync();

        foreach (var promise in promises)
        {
            await RemovePromiseAsync(promise);
        }

        var iterations = await _context.Set<Iteration>()
            .Where(iteration => iteration.ProjectId == project.Id)
            .ToListAsync();

        foreach (var iteration in iterations)
        {
            await RemoveIterationAsync(iteration);
        }

        var permissions = await _context.Set<Permission>()
            .Where(permission => permission.ProjectId == project.Id)
            .ToListAsync();

        _context.RemoveRange(permissions);
        _context.Remove(project);
    }

    /// <summary>Delete an iteration along with all its strides, unlinking moment references.</summary>
    /// <param name="iteration">The iteration to delete.</param>
    /// <remarks>
    ///   Moments referencing the iteration's strides have their <c>AssignedStrideId</c> and
    ///   <c>OriginalStrideId</c> set to <c>null</c> rather than being deleted.
    /// </remarks>
    private async Task RemoveIterationAsync(Iteration iteration)
    {
        var strides = await _context.Set<Stride>()
            .Where(stride => stride.IterationId == iteration.Id)
            .ToListAsync();

        foreach (var stride in strides)
        {
            await RemoveStrideAsync(stride);
        }

        _context.Remove(iteration);
    }

    /// <summary>Delete a stride after nullifying moment references, leaving the moments intact but unassigned.</summary>
    /// <param name="stride">The stride to delete.</param>
    private async Task RemoveStrideAsync(Stride stride)
    {
        var moments = await _context.Set<Moment>()
            .Where(moment => moment.AssignedStrideId == stride.Id || moment.OriginalStrideId == stride.Id)
            .ToListAsync();

        foreach (var moment in moments)
        {
            if (moment.AssignedStrideId == stride.Id)
            {
                moment.AssignedStrideId = null;
            }

            if (moment.OriginalStrideId == stride.Id)
            {
                moment.OriginalStrideId = null;
            }
        }

        _context.Remove(stride);
    }

    /// <summary>Delete a promise along with all its child epics and comments.</summary>
    /// <param name="promise">The promise to delete.</param>
    private async Task RemovePromiseAsync(Promise promise)
    {
        var epics = await _context.Set<Epic>()
            .Where(epic => epic.ProductPromiseId == promise.Id)
            .ToListAsync();

        foreach (var epic in epics)
        {
            await RemoveEpicAsync(epic);
        }

        await RemoveCommentsForEntityAsync("promise", promise.Id);
        _context.Remove(promise);
    }

    /// <summary>Delete an epic along with all its child journeys and comments.</summary>
    /// <param name="epic">The epic to delete.</param>
    private async Task RemoveEpicAsync(Epic epic)
    {
        var journeys = await _context.Set<Journey>()
            .Where(journey => journey.EpicId == epic.Id)
            .ToListAsync();

        foreach (var journey in journeys)
        {
            await RemoveJourneyAsync(journey);
        }

        await RemoveCommentsForEntityAsync("epic", epic.Id);
        _context.Remove(epic);
    }

    /// <summary>Delete a journey along with all its child flows and comments.</summary>
    /// <param name="journey">The journey to delete.</param>
    private async Task RemoveJourneyAsync(Journey journey)
    {
        var flows = await _context.Set<Flow>()
            .Where(flow => flow.JourneyId == journey.Id)
            .ToListAsync();

        foreach (var flow in flows)
        {
            await RemoveFlowAsync(flow);
        }

        await RemoveCommentsForEntityAsync("journey", journey.Id);
        _context.Remove(journey);
    }

    /// <summary>Delete a flow along with all its child moments and comments.</summary>
    /// <param name="flow">The flow to delete.</param>
    private async Task RemoveFlowAsync(Flow flow)
    {
        var moments = await _context.Set<Moment>()
            .Where(moment => moment.FlowId == flow.Id)
            .ToListAsync();

        foreach (var moment in moments)
        {
            await RemoveMomentAsync(moment);
        }

        await RemoveCommentsForEntityAsync("flow", flow.Id);
        _context.Remove(flow);
    }

    /// <summary>Delete a moment along with its assignments, sub-tasks, bug/rework items, and comments.</summary>
    /// <param name="moment">The moment to delete.</param>
    private async Task RemoveMomentAsync(Moment moment)
    {
        var assignments = await _context.Set<MomentAssignment>()
            .Where(assignment => assignment.MomentId == moment.Id)
            .ToListAsync();

        var tasks = await _context.Set<MomentTask>()
            .Where(task => task.MomentId == moment.Id)
            .ToListAsync();

        var bugReworkTasks = await _context.Set<BugReworkTask>()
            .Where(task => task.MomentId == moment.Id)
            .ToListAsync();

        _context.RemoveRange(assignments);
        _context.RemoveRange(tasks);
        _context.RemoveRange(bugReworkTasks);

        await RemoveCommentsForEntityAsync("moment", moment.Id);
        _context.Remove(moment);
    }

    /// <summary>Recursively delete a comment and all its child replies and mentions.</summary>
    /// <param name="comment">The comment to delete.</param>
    private async Task RemoveCommentAsync(Comment comment)
    {
        var replies = await _context.Set<Comment>()
            .Where(reply => reply.ParentCommentId == comment.Id)
            .ToListAsync();

        foreach (var reply in replies)
        {
            await RemoveCommentAsync(reply);
        }

        var mentions = await _context.Set<CommentMention>()
            .Where(mention => mention.CommentId == comment.Id)
            .ToListAsync();

        _context.RemoveRange(mentions);
        _context.Remove(comment);
    }

    /// <summary>Find and recursively delete all top-level comments for a given entity type and ID.</summary>
    /// <param name="parentType">The entity type discriminator (<c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, <c>"moment"</c>).</param>
    /// <param name="parentId">The entity's ID.</param>
    private async Task RemoveCommentsForEntityAsync(string parentType, int parentId)
    {
        var comments = await _context.Set<Comment>()
            .Where(comment => comment.ParentCommentId == null)
            .Where(comment =>
                (parentType == "promise" && comment.ProductPromiseId == parentId) ||
                (parentType == "epic" && comment.EpicId == parentId) ||
                (parentType == "journey" && comment.JourneyId == parentId) ||
                (parentType == "flow" && comment.FlowId == parentId) ||
                (parentType == "moment" && comment.MomentId == parentId))
            .ToListAsync();

        foreach (var comment in comments)
        {
            await RemoveCommentAsync(comment);
        }
    }

    /// <summary>Persist all pending entity changes to the database.</summary>
    /// <remarks>
    ///   Delegates to <see cref="DbContext.SaveChangesAsync(System.Threading.CancellationToken)"/>.
    ///   Applies all tracked inserts, updates, and deletes in a single transaction (if the
    ///   provider supports it).
    /// </remarks>
    /// <exception cref="Microsoft.EntityFrameworkCore.DbUpdateException">A database constraint is violated.</exception>
    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
}
