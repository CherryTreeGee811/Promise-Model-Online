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
        /// Gets or sets the DbSet for user records.
        /// </summary>
        DbSet<User> Users { get; set; }
    }
}