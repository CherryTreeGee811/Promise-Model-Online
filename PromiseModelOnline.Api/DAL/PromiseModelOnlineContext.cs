using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL
{
    /// <summary>
    /// Represents the database context for the Scientific Operations Centre,
    /// including the configuration of tables and initial records.
    /// </summary>
    /// <param name="options">The options to be used by the DbContext.</param>
    public class PromiseModelOnlineContext : DbContext, IPromiseModelOnlineContext
    {
        public PromiseModelOnlineContext(DbContextOptions<PromiseModelOnlineContext> options)
            : base(options)
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
    }
}