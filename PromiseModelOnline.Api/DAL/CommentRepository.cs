using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL;

/// <summary>EF Core implementation of <see cref="ICommentRepository"/> with comment CRUD, mentions, and stack search.</summary>
/// <remarks>
///   Not derived from <see cref="GenericRepository{T}"/> because comments have a polymorphic parent
///   (any entity in the stack hierarchy). Provides threaded comment loading, mention tracking,
///   hierarchy-based auto-complete search, batch ancestor loading, and project-ID resolution.
///   Scoped lifetime.
/// </remarks>
/// <remarks>Initializes the repository with the shared database context.</remarks>
/// <param name="context">The EF Core database context.</param>
public class CommentRepository(PromiseModelOnlineContext context) : ICommentRepository
{
    private static readonly System.Text.RegularExpressions.Regex EntityRefPattern = new(
        @"^(promise|epic|journey|flow|moment)[-\s]?(\d+)$",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase,
        TimeSpan.FromMilliseconds(500));

    /// <summary>Matches a known entity type followed by a separator with no number (e.g. "moment-", "epic ").</summary>
    private static readonly System.Text.RegularExpressions.Regex EntityTypePrefixPattern = new(
        @"^(promise|epic|journey|flow|moment)[-\s]$",
        System.Text.RegularExpressions.RegexOptions.IgnoreCase,
        TimeSpan.FromMilliseconds(500));

    private readonly PromiseModelOnlineContext _context = context;

    /// <summary>Return top-level comments (not replies) for a parent entity, eagerly loading users, mentions, and threaded replies.</summary>
    /// <param name="parentType">Entity type discriminator: <c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, or <c>"moment"</c>. Case-insensitive. Not null.</param>
    /// <param name="parentId">The parent entity's integer ID. Must be greater than zero.</param>
    /// <returns>Threaded comment tree ordered by creation date ascending.</returns>
    /// <exception cref="ArgumentException"><paramref name="parentType"/> is not a valid entity type.</exception>
    public async Task<IEnumerable<Comment>> GetCommentsForEntityAsync(string parentType, int parentId)
    {
        var query = _context.Set<Comment>()
            .Include(c => c.User)
            .Include(c => c.Mentions)
                .ThenInclude(m => m.MentionedUser)
            .Include(c => c.Replies)
                .ThenInclude(r => r.User)
            .Include(c => c.Replies)
                .ThenInclude(r => r.Mentions)
                    .ThenInclude(m => m.MentionedUser)
            .Where(c => c.ParentCommentId == null);

        query = parentType.ToLower() switch
        {
            "promise" => query.Where(c => c.ProductPromiseId == parentId),
            "epic" => query.Where(c => c.EpicId == parentId),
            "journey" => query.Where(c => c.JourneyId == parentId),
            "flow" => query.Where(c => c.FlowId == parentId),
            "moment" => query.Where(c => c.MomentId == parentId),
            _ => throw new ArgumentException("Invalid parent type")
        };

        return await query.OrderBy(c => c.CreatedAt).ToListAsync();
    }

    /// <summary>Persist a new comment and save immediately.</summary>
    /// <remarks>
    ///   The caller must set the appropriate foreign-key property on the comment entity
    ///   (e.g., <c>MomentId</c>, <c>FlowId</c>) before calling this method.
    /// </remarks>
    /// <param name="comment">The comment to insert. Not null.</param>
    /// <exception cref="ArgumentNullException"><paramref name="comment"/> is <c>null</c>.</exception>
    public async Task AddCommentAsync(Comment comment)
    {
        await _context.Set<Comment>().AddAsync(comment);
        await _context.SaveChangesAsync();
    }

    /// <summary>Record a user mention for notification dispatch and save immediately.</summary>
    /// <param name="mention">The mention link record. Not null.</param>
    /// <exception cref="ArgumentNullException"><paramref name="mention"/> is <c>null</c>.</exception>
    public async Task AddMentionAsync(CommentMention mention)
    {
        await _context.Set<CommentMention>().AddAsync(mention);
        await _context.SaveChangesAsync();
    }

    /// <summary>Search the project hierarchy (promise -> epic -> journey -> flow -> moment) for the auto-complete UI.</summary>
    /// <remarks>
    ///   Walks each level applying a case-insensitive free-text match on the <c>Statement</c> field.
    ///   Supports three query modes:
    ///   <list type="bullet">
    ///     <item><description>Free-text: matches any level by statement content.</description></item>
    ///     <item><description>Type-prefixed reference (e.g., <c>"epic-3"</c>): matches a specific entity by sequence number.</description></item>
    ///     <item><description>Type-only (e.g., <c>"promise"</c>): returns all entities of that type.</description></item>
    ///   </list>
    ///   Short-circuits when a type-only filter is fully satisfied at a given level.
    /// </remarks>
    /// <param name="projectId">The project to search within. Must be greater than zero.</param>
    /// <param name="searchTerm">User input. Matches statement text (case-insensitive contains) or a type-sequence reference.</param>
    /// <param name="maxResults">Maximum items to return, range [1, 50]. Default is 5.</param>
    /// <returns>Flat list of matching stack items with type, ID, sequence number, statement, and status color.</returns>
    public async Task<IEnumerable<StackSearchResult>> SearchStackByStatementAsync(int projectId, string searchTerm, int maxResults = 5)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Enumerable.Empty<StackSearchResult>();

        var results = new List<StackSearchResult>();
        var lowerSearch = searchTerm.ToLower();
        var (parsedType, parsedSeq) = ParseEntityReference(searchTerm);

        var typeOnly = parsedType != null && parsedSeq == null;
        bool matchesType(string type) =>
            typeOnly && parsedType == type;

        // Prefix-boost sort: statements starting with the search term (or the parsed type name
        // for type-only searches like "moment-") appear first, then alphabetically.
        IOrderedEnumerable<StackSearchResult> RankResults(IEnumerable<StackSearchResult> source) =>
            source.OrderBy(r =>
                r.Statement.StartsWith(lowerSearch, StringComparison.OrdinalIgnoreCase)
                || (typeOnly && r.Statement.StartsWith(parsedType!, StringComparison.OrdinalIgnoreCase))
                    ? 0 : 1)
            .ThenBy(r => r.Statement);

        var promises = await _context.Set<Promise>()
            .Where(p => p.ProjectId == projectId && (
                p.Statement.ToLower().Contains(lowerSearch) ||
                (parsedType == "promise" && parsedSeq != null && (
                    p.SequenceNumber == parsedSeq ||
                    (p.SequenceNumber >= parsedSeq * 10 && p.SequenceNumber < (parsedSeq + 1) * 10) ||
                    (p.SequenceNumber >= parsedSeq * 100 && p.SequenceNumber < (parsedSeq + 1) * 100) ||
                    (p.SequenceNumber >= parsedSeq * 1000 && p.SequenceNumber < (parsedSeq + 1) * 1000))) ||
                (typeOnly && parsedType == "promise") ||
                (typeOnly && parsedType != "promise" && p.Statement.ToLower().Contains(parsedType!))))
            .OrderBy(p => p.Statement)
            .Take(typeOnly && parsedType == "promise" ? int.MaxValue : maxResults)
            .ToListAsync();
        results.AddRange(promises.Select(p => new StackSearchResult("promise", p.Id, p.SequenceNumber, p.Statement, p.StatusColor)));

        if (matchesType("promise"))
            return RankResults(results).Take(maxResults).ToList();

        var promiseIds = await _context.Set<Promise>()
            .Where(p => p.ProjectId == projectId)
            .Select(p => p.Id)
            .ToListAsync();

        var epics = await _context.Set<Epic>()
            .Where(e => promiseIds.Contains(e.ProductPromiseId) && (
                e.Statement.ToLower().Contains(lowerSearch) ||
                (parsedType == "epic" && parsedSeq != null && (
                    e.SequenceNumber == parsedSeq ||
                    (e.SequenceNumber >= parsedSeq * 10 && e.SequenceNumber < (parsedSeq + 1) * 10) ||
                    (e.SequenceNumber >= parsedSeq * 100 && e.SequenceNumber < (parsedSeq + 1) * 100) ||
                    (e.SequenceNumber >= parsedSeq * 1000 && e.SequenceNumber < (parsedSeq + 1) * 1000))) ||
                (typeOnly && parsedType == "epic") ||
                (typeOnly && parsedType != "epic" && e.Statement.ToLower().Contains(parsedType!))))
            .OrderBy(e => e.Statement)
            .Take(typeOnly && parsedType == "epic" ? int.MaxValue : maxResults)
            .ToListAsync();
        results.AddRange(epics.Select(e => new StackSearchResult("epic", e.Id, e.SequenceNumber, e.Statement, e.StatusColor)));

        if (matchesType("epic"))
            return RankResults(results).Take(maxResults).ToList();

        var epicIds = epics.Select(e => e.Id)
            .Concat(await _context.Set<Epic>()
                .Where(e => promiseIds.Contains(e.ProductPromiseId))
                .Select(e => e.Id)
                .ToListAsync())
            .Distinct()
            .ToList();

        var journeys = await _context.Set<Journey>()
            .Where(j => epicIds.Contains(j.EpicId) && (
                j.Statement.ToLower().Contains(lowerSearch) ||
                (parsedType == "journey" && parsedSeq != null && (
                    j.SequenceNumber == parsedSeq ||
                    (j.SequenceNumber >= parsedSeq * 10 && j.SequenceNumber < (parsedSeq + 1) * 10) ||
                    (j.SequenceNumber >= parsedSeq * 100 && j.SequenceNumber < (parsedSeq + 1) * 100) ||
                    (j.SequenceNumber >= parsedSeq * 1000 && j.SequenceNumber < (parsedSeq + 1) * 1000))) ||
                (typeOnly && parsedType == "journey") ||
                (typeOnly && parsedType != "journey" && j.Statement.ToLower().Contains(parsedType!))))
            .OrderBy(j => j.Statement)
            .Take(typeOnly && parsedType == "journey" ? int.MaxValue : maxResults)
            .ToListAsync();
        results.AddRange(journeys.Select(j => new StackSearchResult("journey", j.Id, j.SequenceNumber, j.Statement, j.StatusColor)));

        if (matchesType("journey"))
            return RankResults(results).Take(maxResults).ToList();

        var journeyIds = journeys.Select(j => j.Id)
            .Concat(await _context.Set<Journey>()
                .Where(j => epicIds.Contains(j.EpicId))
                .Select(j => j.Id)
                .ToListAsync())
            .Distinct()
            .ToList();

        var flows = await _context.Set<Flow>()
            .Where(f => journeyIds.Contains(f.JourneyId) && (
                f.Statement.ToLower().Contains(lowerSearch) ||
                (parsedType == "flow" && parsedSeq != null && (
                    f.SequenceNumber == parsedSeq ||
                    (f.SequenceNumber >= parsedSeq * 10 && f.SequenceNumber < (parsedSeq + 1) * 10) ||
                    (f.SequenceNumber >= parsedSeq * 100 && f.SequenceNumber < (parsedSeq + 1) * 100) ||
                    (f.SequenceNumber >= parsedSeq * 1000 && f.SequenceNumber < (parsedSeq + 1) * 1000))) ||
                (typeOnly && parsedType == "flow") ||
                (typeOnly && parsedType != "flow" && f.Statement.ToLower().Contains(parsedType!))))
            .OrderBy(f => f.Statement)
            .Take(typeOnly && parsedType == "flow" ? int.MaxValue : maxResults)
            .ToListAsync();
        results.AddRange(flows.Select(f => new StackSearchResult("flow", f.Id, f.SequenceNumber, f.Statement, f.StatusColor)));

        if (matchesType("flow"))
            return RankResults(results).Take(maxResults).ToList();

        var flowIds = flows.Select(f => f.Id)
            .Concat(await _context.Set<Flow>()
                .Where(f => journeyIds.Contains(f.JourneyId))
                .Select(f => f.Id)
                .ToListAsync())
            .Distinct()
            .ToList();

        var moments = await _context.Set<Moment>()
            .Where(m => flowIds.Contains(m.FlowId) && (
                m.Statement.ToLower().Contains(lowerSearch) ||
                (parsedType == "moment" && parsedSeq != null && (
                    m.SequenceNumber == parsedSeq ||
                    (m.SequenceNumber >= parsedSeq * 10 && m.SequenceNumber < (parsedSeq + 1) * 10) ||
                    (m.SequenceNumber >= parsedSeq * 100 && m.SequenceNumber < (parsedSeq + 1) * 100) ||
                    (m.SequenceNumber >= parsedSeq * 1000 && m.SequenceNumber < (parsedSeq + 1) * 1000))) ||
                (typeOnly && parsedType == "moment")))
            .OrderBy(m => m.Statement)
            .Take(typeOnly && parsedType == "moment" ? int.MaxValue : maxResults)
            .ToListAsync();
        results.AddRange(moments.Select(m => new StackSearchResult("moment", m.Id, m.SequenceNumber, m.Statement, m.StatusColor)));

        return RankResults(results).Take(maxResults).ToList();
    }
    /// <summary>Parse a search term as a type-prefixed entity reference or bare type name.</summary>
    /// <remarks>
    ///   Supports formats like <c>"epic-3"</c>, <c>"promise 42"</c> (type + sequence),
    ///   or <c>"moment-"</c> (type with trailing separator).
    /// </remarks>
    /// <param name="searchTerm">The raw search input.</param>
    /// <returns>A tuple of (entity type, sequence number) if parsed; otherwise <c>(null, null)</c>.</returns>
    private static (string? type, int? seq) ParseEntityReference(string searchTerm)
    {
        var trimmed = searchTerm.Trim();
        var match = EntityRefPattern.Match(trimmed);

        if (match.Success)
            return (match.Groups[1].Value.ToLowerInvariant(), int.Parse(match.Groups[2].Value));

        var prefixMatch = EntityTypePrefixPattern.Match(trimmed);

        if (prefixMatch.Success)
            return (prefixMatch.Groups[1].Value.ToLowerInvariant(), null);

        return (null, null);
    }

    /// <summary>Load all promises in a project.</summary>
    /// <param name="projectId">The project ID. Must be greater than zero.</param>
    /// <returns>All promises belonging to the project.</returns>
    public async Task<IEnumerable<Promise>> GetPromisesByProjectAsync(int projectId) => await _context.Set<Promise>()
            .Where(p => p.ProjectId == projectId)
            .ToListAsync();

    /// <summary>Batch-load epics for a list of promise IDs using a single query.</summary>
    /// <param name="promiseIds">Promise IDs to scope the query. Not null.</param>
    /// <returns>Epics whose <c>ProductPromiseId</c> is in <paramref name="promiseIds"/>.</returns>
    public async Task<IEnumerable<Epic>> GetEpicsByPromiseIdsAsync(List<int> promiseIds) => await _context.Set<Epic>()
            .Where(e => promiseIds.Contains(e.ProductPromiseId))
            .ToListAsync();

    /// <summary>Batch-load journeys for a list of epic IDs using a single query.</summary>
    /// <param name="epicIds">Epic IDs to scope the query. Not null.</param>
    /// <returns>Journeys whose <c>EpicId</c> is in <paramref name="epicIds"/>.</returns>
    public async Task<IEnumerable<Journey>> GetJourneysByEpicIdsAsync(List<int> epicIds) => await _context.Set<Journey>()
            .Where(j => epicIds.Contains(j.EpicId))
            .ToListAsync();

    /// <summary>Batch-load flows for a list of journey IDs using a single query.</summary>
    /// <param name="journeyIds">Journey IDs to scope the query. Not null.</param>
    /// <returns>Flows whose <c>JourneyId</c> is in <paramref name="journeyIds"/>.</returns>
    public async Task<IEnumerable<Flow>> GetFlowsByJourneyIdsAsync(List<int> journeyIds) => await _context.Set<Flow>()
            .Where(f => journeyIds.Contains(f.JourneyId))
            .ToListAsync();

    /// <summary>Batch-load moments for a list of flow IDs using a single query.</summary>
    /// <param name="flowIds">Flow IDs to scope the query. Not null.</param>
    /// <returns>Moments whose <c>FlowId</c> is in <paramref name="flowIds"/>.</returns>
    public async Task<IEnumerable<Moment>> GetMomentsByFlowIdsAsync(List<int> flowIds) => await _context.Set<Moment>()
            .Where(m => flowIds.Contains(m.FlowId))
            .ToListAsync();

    /// <summary>Resolve the root project ID for any commentable entity by walking its ancestor chain.</summary>
    /// <remarks>
    ///   Walks the hierarchy upward: moment -> flow -> journey -> epic -> promise -> project.
    ///   Each ancestor is looked up individually with validation that it exists.
    ///   Throws if any ancestor is missing or if <paramref name="parentType"/> is invalid.
    /// </remarks>
    /// <param name="parentType">Entity type discriminator (same values as <see cref="GetCommentsForEntityAsync"/>). Case-insensitive.</param>
    /// <param name="parentId">The entity's integer ID.</param>
    /// <returns>The root project ID.</returns>
    /// <exception cref="ArgumentException"><paramref name="parentType"/> is invalid or an ancestor entity cannot be found.</exception>
    public async Task<int> ResolveProjectIdAsync(string parentType, int parentId)
    {
        var normalizedType = parentType.ToLower();

        if (normalizedType == "promise")
        {
            var promise = await _context.Set<Promise>().FindAsync(parentId);
            return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
        }

        if (normalizedType == "epic")
        {
            var epic = await _context.Set<Epic>().FindAsync(parentId);
            if (epic == null) throw new ArgumentException("Epic not found");
            var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
        }

        if (normalizedType == "journey")
        {
            var journey = await _context.Set<Journey>().FindAsync(parentId);
            if (journey == null) throw new ArgumentException("Journey not found");
            var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
            if (epic == null) throw new ArgumentException("Epic not found");
            var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
        }

        if (normalizedType == "flow")
        {
            var flow = await _context.Set<Flow>().FindAsync(parentId);
            if (flow == null) throw new ArgumentException("Flow not found");
            var journey = await _context.Set<Journey>().FindAsync(flow.JourneyId);
            if (journey == null) throw new ArgumentException("Journey not found");
            var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
            if (epic == null) throw new ArgumentException("Epic not found");
            var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
        }

        if (normalizedType == "moment")
        {
            var moment = await _context.Set<Moment>().FindAsync(parentId);
            if (moment == null) throw new ArgumentException("Moment not found");
            var flow = await _context.Set<Flow>().FindAsync(moment.FlowId);
            if (flow == null) throw new ArgumentException("Flow not found");
            var journey = await _context.Set<Journey>().FindAsync(flow.JourneyId);
            if (journey == null) throw new ArgumentException("Journey not found");
            var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
            if (epic == null) throw new ArgumentException("Epic not found");
            var promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            return promise?.ProjectId ?? throw new ArgumentException("Promise not found");
        }

        throw new ArgumentException($"Invalid parent type: {parentType}");
    }

    /// <summary>Resolve the client-side detail route for any commentable entity.</summary>
    /// <remarks>
    ///   Walks the ancestor chain to the owning project and builds a route of the form
    ///   <c>/{ownerSlug}/{projectSlug}/{pluralType}/{sequenceNumber}</c>. Returns <c>null</c>
    ///   if the entity or any ancestor cannot be found.
    /// </remarks>
    /// <param name="parentType">Entity type discriminator (same values as <see cref="GetCommentsForEntityAsync"/>).</param>
    /// <param name="parentId">The entity's integer ID.</param>
    /// <returns>The client detail route, or <c>null</c> if unresolvable.</returns>
    public async Task<string?> ResolveEntityRouteAsync(string parentType, int parentId)
    {
        var normalizedType = parentType.ToLower();
        var pluralType = normalizedType switch
        {
            "promise" => "promises",
            "epic" => "epics",
            "journey" => "journeys",
            "flow" => "flows",
            "moment" => "moments",
            _ => null
        };
        if (pluralType is null)
            return null;

        Promise? promise = null;
        int? sequenceNumber = null;

        if (normalizedType == "promise")
        {
            promise = await _context.Set<Promise>().FindAsync(parentId);
            if (promise is null) return null;
            sequenceNumber = promise.SequenceNumber;
        }
        else if (normalizedType == "epic")
        {
            var epic = await _context.Set<Epic>().FindAsync(parentId);
            if (epic is null) return null;
            promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            if (promise is null) return null;
            sequenceNumber = epic.SequenceNumber;
        }
        else if (normalizedType == "journey")
        {
            var journey = await _context.Set<Journey>().FindAsync(parentId);
            if (journey is null) return null;
            var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
            if (epic is null) return null;
            promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            if (promise is null) return null;
            sequenceNumber = journey.SequenceNumber;
        }
        else if (normalizedType == "flow")
        {
            var flow = await _context.Set<Flow>().FindAsync(parentId);
            if (flow is null) return null;
            var journey = await _context.Set<Journey>().FindAsync(flow.JourneyId);
            if (journey is null) return null;
            var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
            if (epic is null) return null;
            promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            if (promise is null) return null;
            sequenceNumber = flow.SequenceNumber;
        }
        else if (normalizedType == "moment")
        {
            var moment = await _context.Set<Moment>().FindAsync(parentId);
            if (moment is null) return null;
            var flow = await _context.Set<Flow>().FindAsync(moment.FlowId);
            if (flow is null) return null;
            var journey = await _context.Set<Journey>().FindAsync(flow.JourneyId);
            if (journey is null) return null;
            var epic = await _context.Set<Epic>().FindAsync(journey.EpicId);
            if (epic is null) return null;
            promise = await _context.Set<Promise>().FindAsync(epic.ProductPromiseId);
            if (promise is null) return null;
            sequenceNumber = moment.SequenceNumber;
        }

        if (promise is null || sequenceNumber is null)
            return null;

        var project = await _context.Set<Project>().FindAsync(promise.ProjectId);
        if (project is null)
            return null;

        var owner = await _context.Set<User>().FindAsync(project.OwnerId);
        if (owner is null)
            return null;

        return $"/{owner.Slug}/{project.Slug}/{pluralType}/{sequenceNumber}";
    }
}
