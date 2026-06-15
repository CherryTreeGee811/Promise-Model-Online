using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    /// <summary>Repository for <see cref="Comment"/> entities with stack search and mentions.</summary>
    /// <remarks>
    ///   Not derived from <see cref="IGenericRepository{T}"/> because comments have a polymorphic
    ///   parent (any stack entity type). Provides CRUD, mention tracking, hierarchy-based
    ///   auto-complete search, batch ancestor loading, and project-ID resolution. Scoped lifetime.
    /// </remarks>
    public interface ICommentRepository
    {
        /// <summary>Return top-level comments for a parent entity.</summary>
        /// <remarks>
        ///   Eagerly loads user, mentions, and threaded replies. Results are ordered by creation
        ///   date ascending.
        /// </remarks>
        /// <param name="parentType">Entity type discriminator: <c>"promise"</c>, <c>"epic"</c>,
        ///   <c>"journey"</c>, <c>"flow"</c>, or <c>"moment"</c>. Case-insensitive. Not null.</param>
        /// <param name="parentId">The parent entity's integer ID. Must be greater than zero.</param>
        /// <returns>Threaded comment tree for the entity.</returns>
        /// <exception cref="System.ArgumentException"><paramref name="parentType"/> is not a valid type.</exception>
        Task<IEnumerable<Comment>> GetCommentsForEntityAsync(string parentType, int parentId);

        /// <summary>Persist a new comment.</summary>
        /// <remarks>
        ///   Saves immediately. The caller must set the appropriate foreign-key property
        ///   (e.g., <c>MomentId</c>, <c>FlowId</c>) on the comment entity.
        /// </remarks>
        /// <param name="comment">The comment to insert. Not null.</param>
        /// <exception cref="System.ArgumentNullException"><paramref name="comment"/> is <c>null</c>.</exception>
        Task AddCommentAsync(Comment comment);

        /// <summary>Record a user mention for notification dispatch.</summary>
        /// <param name="mention">The mention link record. Not null.</param>
        /// <exception cref="System.ArgumentNullException"><paramref name="mention"/> is <c>null</c>.</exception>
        Task AddMentionAsync(CommentMention mention);

        /// <summary>Search the project hierarchy for auto-complete.</summary>
        /// <remarks>
        ///   Walks the hierarchy (promises -> epics -> journeys -> flows -> moments) applying a
        ///   free-text match on the <c>Statement</c> field. Supports type-prefixed queries
        ///   (e.g., <c>"epic-3"</c>) and bare type filters. Short-circuits when a type-only
        ///   filter is satisfied.
        /// </remarks>
        /// <param name="projectId">The project to search within. Must be greater than zero.</param>
        /// <param name="searchTerm">User input. Matches statement text (case-insensitive contains)
        ///   or a type-sequence reference.</param>
        /// <param name="maxResults">Max items to return, range [1, 50]. Default is 5.</param>
        /// <returns>Flat list of matching stack items with type, ID, sequence, statement, and status color.</returns>
        Task<IEnumerable<StackSearchResult>> SearchStackByStatementAsync(int projectId, string searchTerm, int maxResults = 5);

        /// <summary>Resolve the root project ID for any commentable entity.</summary>
        /// <remarks>
        ///   Walks the ancestor chain step by step (moment -> flow -> journey -> epic -> promise
        ///   -> project). Throws if any ancestor is missing.
        /// </remarks>
        /// <param name="parentType">Entity type discriminator (same values as <see cref="GetCommentsForEntityAsync"/>).</param>
        /// <param name="parentId">The entity's integer ID.</param>
        /// <returns>The root project ID.</returns>
        /// <exception cref="System.ArgumentException"><paramref name="parentType"/> is invalid or an ancestor cannot be found.</exception>
        Task<int> ResolveProjectIdAsync(string parentType, int parentId);

        /// <summary>Load all promises in a project.</summary>
        /// <param name="projectId">The project ID. Must be greater than zero.</param>
        /// <returns>All promises belonging to the project.</returns>
        Task<IEnumerable<Promise>> GetPromisesByProjectAsync(int projectId);

        /// <summary>Batch-load epics for a list of promise IDs.</summary>
        /// <param name="promiseIds">Promise IDs to scope the query. Not null.</param>
        /// <returns>Epics whose <c>ProductPromiseId</c> is in <paramref name="promiseIds"/>.</returns>
        Task<IEnumerable<Epic>> GetEpicsByPromiseIdsAsync(List<int> promiseIds);

        /// <summary>Batch-load journeys for a list of epic IDs.</summary>
        /// <param name="epicIds">Epic IDs to scope the query. Not null.</param>
        /// <returns>Journeys whose <c>EpicId</c> is in <paramref name="epicIds"/>.</returns>
        Task<IEnumerable<Journey>> GetJourneysByEpicIdsAsync(List<int> epicIds);

        /// <summary>Batch-load flows for a list of journey IDs.</summary>
        /// <param name="journeyIds">Journey IDs to scope the query. Not null.</param>
        /// <returns>Flows whose <c>JourneyId</c> is in <paramref name="journeyIds"/>.</returns>
        Task<IEnumerable<Flow>> GetFlowsByJourneyIdsAsync(List<int> journeyIds);

        /// <summary>Batch-load moments for a list of flow IDs.</summary>
        /// <param name="flowIds">Flow IDs to scope the query. Not null.</param>
        /// <returns>Moments whose <c>FlowId</c> is in <paramref name="flowIds"/>.</returns>
        Task<IEnumerable<Moment>> GetMomentsByFlowIdsAsync(List<int> flowIds);
    }
}
