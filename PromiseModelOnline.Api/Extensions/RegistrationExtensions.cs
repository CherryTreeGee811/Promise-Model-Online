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
            services.AddHttpClient<PromiseModelOnline.Api.DAL.Interfaces.IAuthClient, PromiseModelOnline.Api.DAL.AuthClient>(client =>
            {
                client.BaseAddress = new Uri(configuration["JwtSettings:Issuer"]);
                client.Timeout = TimeSpan.FromSeconds(10);
            })
            .ConfigurePrimaryHttpMessageHandler(() =>
            {
                var handler = new HttpClientHandler();
                handler.ServerCertificateCustomValidationCallback =
                    (sender, cert, chain, sslPolicyErrors) => true;
                return handler;
            });
        }
    }
}
