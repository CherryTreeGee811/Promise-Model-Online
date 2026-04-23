
using Microsoft.EntityFrameworkCore;

namespace PromiseModelOnline.Api.Models;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SQL Server disallows multiple cascade paths; keep all relationships as NO ACTION.
        foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.NoAction;
        }
    }
    
    public DbSet<Promise> Promises { get; set; }
    public DbSet<BugReworkTask> BugReworkTasks { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Epic> Epics { get; set; }
    public DbSet<Flow> Flows { get; set; }
    public DbSet<Journey> Journeys { get; set; }
    public DbSet<MomentAssignment> MomentAssignments { get; set; }
    public DbSet<Moment> Moments { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Stride> Strides { get; set; }
    public DbSet<User> Users { get; set; }
}