using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;
using PromiseModelOnline.Auth.DAL.Interfaces;

namespace PromiseModelOnline.Auth.DAL
{
    /// <summary>EF Core database context for the Auth service, including Identity and OpenIddict entity sets.</summary>
    /// <remarks>
    ///   Configures OpenIddict entity table mappings (<c>OpenIddictApplications</c>,
    ///   <c>OpenIddictAuthorizations</c>, <c>OpenIddictScopes</c>, <c>OpenIddictTokens</c>).
    /// </remarks>
    public class AuthorizationDbContext : IdentityDbContext<IdentityUser>, IAuthorizationDbContext
    {
        /// <param name="options">The DbContext options.</param>
        public AuthorizationDbContext(DbContextOptions<AuthorizationDbContext> options)
            : base(options) { }

        /// <summary>Parameterless constructor for EF Core migrations and scaffolding.</summary>
        protected AuthorizationDbContext() { }

        /// <summary>Identity users.</summary>
        public new DbSet<IdentityUser> Users { get; set; } = null!;

        /// <summary>OpenIddict registered OAuth2 applications.</summary>
        public DbSet<OpenIddictEntityFrameworkCoreApplication> OpenIddictApplications { get; set; } = null!;
        
        /// <summary>OpenIddict authorization records.</summary>
        public DbSet<OpenIddictEntityFrameworkCoreAuthorization> OpenIddictAuthorizations { get; set; } = null!;
        
        /// <summary>OpenIddict scopes.</summary>
        public DbSet<OpenIddictEntityFrameworkCoreScope> OpenIddictScopes { get; set; } = null!;
        
        /// <summary>OpenIddict token records.</summary>
        public DbSet<OpenIddictEntityFrameworkCoreToken> OpenIddictTokens { get; set; } = null!;

        /// <summary>Configure OpenIddict entity table mappings.</summary>
        /// <param name="builder">The <see cref="ModelBuilder"/> used to configure the model.</param>
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

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
    }
}
