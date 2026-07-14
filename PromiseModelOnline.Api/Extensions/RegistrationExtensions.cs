using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Mappers;
using PromiseModelOnline.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System;

namespace PromiseModelOnline.Api.Extensions;

/// <summary>DI registration extension for Promise Model Online services.</summary>
/// <remarks>
///   Registers all repository, service, and mapper types as scoped dependencies.
///   Configures the EF Core <see cref="PromiseModelOnlineContext"/> with SQL Server
///   using a connection string that supports Docker secret resolution.
///   Call from <c>Program.cs</c>: <c>services.AddPromiseModelOnlineScopes(configuration)</c>.
/// </remarks>
public static class RegistrationExtensions
{
    /// <summary>Register all Promise Model Online dependencies in the DI container.</summary>
    /// <param name="services">The <see cref="IServiceCollection"/> to register into.</param>
    /// <param name="configuration">The application configuration for connection strings.</param>
    public static void AddPromiseModelOnlineScopes(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();

        var connectionString = (configuration.GetConnectionString("MSSQL") ?? "").ResolveSecrets();
        services.AddDbContext<PromiseModelOnlineContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<IPromiseModelOnlineContext>(sp =>
            sp.GetRequiredService<PromiseModelOnlineContext>());
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped(typeof(IGenericService<>), typeof(GenericService<>));
        services.AddScoped(typeof(IGenericMapper<,>), typeof(GenericMapper<,>));
        services.AddScoped<IHierarchyStatusService, HierarchyStatusService>();
        services.AddScoped<IEpicRepository, EpicRepository>();
        services.AddScoped<IEpicService, EpicService>();
        services.AddScoped<IJourneyRepository, JourneyRepository>();
        services.AddScoped<IJourneyService, JourneyService>();
        services.AddScoped<IFlowRepository, FlowRepository>();
        services.AddScoped<IFlowService, FlowService>();
        services.AddScoped<IMomentRepository, MomentRepository>();
        services.AddScoped<IMomentService, MomentService>();
        services.AddScoped<IMomentTaskRepository, MomentTaskRepository>();
        services.AddScoped<IMomentTaskService, MomentTaskService>();
        services.AddScoped<IStrideRepository, StrideRepository>();
        services.AddScoped<IStrideService, StrideService>();
        services.AddScoped<IIterationRepository, IterationRepository>();
        services.AddScoped<IIterationService, IterationService>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IGenericMapper<Comment, CommentDto>, CommentMapper>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IPermissionRepository, PermissionRepository>();
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IGenericMapper<Permission, PermissionDto>, PermissionMapper>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IProjectExportService, ProjectExportService>();
        services.AddScoped<IProjectImportValidationService, ProjectImportValidationService>();
        services.AddScoped<IProjectImportService, ProjectImportService>();
        services.AddStrideAutomation();
        services.AddScoped<IReactionRepository, ReactionRepository>();
        services.AddScoped<IReactionService, ReactionService>();

        var authConnectionString = (configuration.GetConnectionString("AuthDB") ?? "").ResolveSecrets();
        services.AddScoped<IAuthUserLookupService>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<AuthUserLookupService>>();
            return new AuthUserLookupService(authConnectionString, logger);
        });

        services.AddScoped<IInvitationEmailService, InvitationEmailService>();
    }
}
