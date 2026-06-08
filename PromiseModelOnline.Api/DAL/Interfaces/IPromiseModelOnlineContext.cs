using System.Data;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    /// <summary>
    /// Defines the contract for the Promise Model Online database context.
    /// </summary>
    public interface IPromiseModelOnlineContext
    {
        /// <summary>
        /// Gets or sets the DbSet for promise records.
        /// </summary>
        DbSet<Promise> Promises { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for epic records.
        /// </summary>
        DbSet<Epic> Epics { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for journey records.
        /// </summary>
        DbSet<Journey> Journeys { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for flow records.
        /// </summary>
        DbSet<Flow> Flows { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for moment records.
        /// </summary>
        DbSet<Moment> Moments { get; set; }

         /// <summary>
        /// Gets or sets the DbSet for project records.
        /// </summary>
        DbSet<Project> Projects { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for stride records.
        /// </summary>
        DbSet<Stride> Strides { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for iteration records.
        /// </summary>
        DbSet<Iteration> Iterations { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for user records.
        /// </summary>
        DbSet<User> Users { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for reaction records.
        /// </summary>
        DbSet<Reaction> Reactions { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for audit events.
        /// </summary>
        DbSet<AuditEvent> AuditEvents { get; set; }

        /// <summary>
        /// Gets or sets the DbSet for entity-scoped sequence counters.
        /// </summary>
        DbSet<EntitySequence> EntitySequences { get; set; }

        /// <summary>
        /// Atomically allocates the next sequence number for a promise under a project.
        /// </summary>
        Task<int> GetNextPromiseSequenceAsync(int projectId);

        /// <summary>
        /// Atomically allocates the next sequence number for an epic under a promise.
        /// </summary>
        Task<int> GetNextEpicSequenceAsync(int promiseId);

        /// <summary>
        /// Atomically allocates the next sequence number for a journey under an epic.
        /// </summary>
        Task<int> GetNextJourneySequenceAsync(int epicId);

        /// <summary>
        /// Atomically allocates the next sequence number for a flow under a journey.
        /// </summary>
        Task<int> GetNextFlowSequenceAsync(int journeyId);

        /// <summary>
        /// Atomically allocates the next sequence number for a moment under a flow.
        /// </summary>
        Task<int> GetNextMomentSequenceAsync(int flowId);
    }
}