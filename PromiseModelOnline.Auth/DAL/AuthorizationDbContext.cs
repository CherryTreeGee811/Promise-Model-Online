using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
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
    }
}