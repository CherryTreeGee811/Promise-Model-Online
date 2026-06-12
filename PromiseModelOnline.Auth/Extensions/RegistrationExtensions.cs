using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.DAL.Interfaces;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class RegistrationExtensions
    {
        public static void AddAuthScopes(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AuthorizationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("MSSQL")));
            services.AddScoped<IAuthorizationDbContext, AuthorizationDbContext>();
            services.AddIdentity<IdentityUser, IdentityRole>()
                .AddEntityFrameworkStores<AuthorizationDbContext>()
                .AddDefaultTokenProviders();

            services.AddAuthorization();
        }
    }
}