using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Mappers;
using Microsoft.EntityFrameworkCore;

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
        }
    }
}
