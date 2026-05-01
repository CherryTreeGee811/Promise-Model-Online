using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Mappers;
using Microsoft.EntityFrameworkCore;
using System;

namespace PromiseModelOnline.Api.Extensions
{
    public static class RegistrationExtensions
    {
        public static void AddPromiseModelOnlineScopes(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<PromiseModelOnlineContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("MSSQL")));

            services.AddScoped<IPromiseModelOnlineContext, PromiseModelOnlineContext>();
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped(typeof(IGenericService<>), typeof(GenericService<>));
            services.AddScoped(typeof(IGenericMapper<,>), typeof(GenericMapper<,>));
            services.AddHttpClient<ILoginRepository, LoginRepository>(client =>
            {
                // Base address will be the Auth server; `LoginRepository` posts to a relative path
                client.BaseAddress = new Uri(configuration["JwtSettings:Issuer"] ?? "http://promisemodelonline.auth:8060");
                client.Timeout = TimeSpan.FromSeconds(10);
            })
            .SetHandlerLifetime(TimeSpan.FromMinutes(5))
            .ConfigurePrimaryHttpMessageHandler(() =>
            {
                // In development allow self-signed certs for internal container communication.
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? configuration["ASPNETCORE_ENVIRONMENT"];
                if (!string.IsNullOrEmpty(env) && env.Equals("Development", StringComparison.OrdinalIgnoreCase))
                {
                    return new HttpClientHandler
                    {
                        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                    };
                }

                return new HttpClientHandler();
            });
        }
    }
}
