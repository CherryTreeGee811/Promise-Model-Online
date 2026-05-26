using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PromiseModelOnline.Auth.DAL;

namespace PromiseModelOnline.Auth
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AuthorizationDbContext>
    {
        public AuthorizationDbContext CreateDbContext(string[] args)
        {
            var conn = Environment.GetEnvironmentVariable("ConnectionStrings__MSSQL");

            var builder = new DbContextOptionsBuilder<AuthorizationDbContext>();
            builder.UseSqlServer(conn);

            return new AuthorizationDbContext(builder.Options);
        }
    }
}
