
using Microsoft.EntityFrameworkCore;

namespace PromiseModelOnline.Api.Models;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
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