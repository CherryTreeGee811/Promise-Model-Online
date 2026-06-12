using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
<<<<<<< HEAD
using OpenIddict.EntityFrameworkCore.Models;
using PromiseModelOnline.Auth.DAL.Interfaces;

namespace PromiseModelOnline.Auth.DAL
{
    public class AuthorizationDbContext : IdentityDbContext<IdentityUser>, IAuthorizationDbContext
    {
        public AuthorizationDbContext(DbContextOptions<AuthorizationDbContext> options)
            : base(options) { }

        protected AuthorizationDbContext() { }

        public new DbSet<IdentityUser> Users { get; set; } = null!;

        // OpenIddict entities – explicit DbSet properties
        public DbSet<OpenIddictEntityFrameworkCoreApplication> OpenIddictApplications { get; set; } = null!;
        public DbSet<OpenIddictEntityFrameworkCoreAuthorization> OpenIddictAuthorizations { get; set; } = null!;
        public DbSet<OpenIddictEntityFrameworkCoreScope> OpenIddictScopes { get; set; } = null!;
        public DbSet<OpenIddictEntityFrameworkCoreToken> OpenIddictTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure OpenIddict tables explicitly – bulletproof
            builder.Entity<OpenIddictEntityFrameworkCoreApplication>(entity =>
            {
                entity.ToTable("OpenIddictApplications");
                entity.HasKey(app => app.Id);
            });

            builder.Entity<OpenIddictEntityFrameworkCoreAuthorization>(entity =>
            {
                entity.ToTable("OpenIddictAuthorizations");
                entity.HasKey(auth => auth.Id);
            });

            builder.Entity<OpenIddictEntityFrameworkCoreScope>(entity =>
            {
                entity.ToTable("OpenIddictScopes");
                entity.HasKey(scope => scope.Id);
            });

            builder.Entity<OpenIddictEntityFrameworkCoreToken>(entity =>
            {
                entity.ToTable("OpenIddictTokens");
                entity.HasKey(token => token.Id);
            });
        }
||||||| 1bedf4f
=======
using PromiseModelOnline.Auth.DAL.Interfaces;
using PromiseModelOnline.Auth.Models;

namespace PromiseModelOnline.Auth.DAL
{
    public class AuthorizationDbContext : IdentityDbContext<IdentityUser>, IAuthorizationDbContext
    {
        public AuthorizationDbContext(DbContextOptions<AuthorizationDbContext> options)
            : base(options)
        {
        }

        // Parameterless ctor for design-time tools
        protected AuthorizationDbContext() { }

        // Expose EF Core DbSet directly (keep EF coupling as requested)
        public new DbSet<IdentityUser> Users { get; set; } = null!;
        
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}