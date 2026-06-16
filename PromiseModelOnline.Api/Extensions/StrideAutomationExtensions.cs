using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Extensions;
/// <summary>Registers the background service that automates stride progression and deadline notifications.</summary>
public static class StrideAutomationExtensions
{
    /// <summary>Register the <see cref="StrideAutomationService"/> as a hosted service.</summary>
    public static IServiceCollection AddStrideAutomation(this IServiceCollection services)
    {
        services.AddHostedService<StrideAutomationService>();
        return services;
    }
}

/// <summary>Background service that runs hourly to progress strides, auto-create iterations, and send deadline notifications.</summary>
/// <remarks>
///   Every hour:
///   <list type="bullet">
///     <item>Moves unfinished moments from ended strides to the next available stride.</item>
///     <item>Auto-creates the next iteration (with 4 strides) when all strides of an iteration have ended.</item>
///     <item>Sends deadline notifications for strides ending in 3 days.</item>
///   </list>
/// </remarks>
internal class StrideAutomationService : IHostedService, IDisposable
{
    private Timer? _timer;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<StrideAutomationService> _logger;

    /// <summary>Initializes the automation service with scope factory and logger.</summary>
    /// <param name="scopeFactory">Factory for creating service scopes.</param>
    /// <param name="logger">Logger for automation events.</param>
    public StrideAutomationService(IServiceScopeFactory scopeFactory,
                                   ILogger<StrideAutomationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>Start the automation timer, firing immediately and then every hour.</summary>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stride automation service started.");
        _timer = new Timer(async _ => await DoWorkAsync(), null,
            TimeSpan.Zero, TimeSpan.FromHours(1));
        return Task.CompletedTask;
    }

    /// <summary>Execute the automation: progress strides, auto-create iterations, and send deadline notifications.</summary>
    private async Task DoWorkAsync()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var strideService = scope.ServiceProvider.GetRequiredService<IStrideService>();
            var momentService = scope.ServiceProvider.GetRequiredService<IMomentService>();
            var iterationService = scope.ServiceProvider.GetRequiredService<IIterationService>();

            var now = DateTime.UtcNow.Date;
            var allStrides = await strideService.GetAllAsync();

            var endedStridesByIteration = allStrides
                .Where(s => s.IterationId.HasValue && s.EndDate.Date < now)
                .GroupBy(s => s.IterationId!.Value)
                .ToList();

            foreach (var group in endedStridesByIteration)
            {
                var iteration = await iterationService.GetByIdAsync(group.Key);
                if (iteration is null) continue;

                var iterationStrides = (await strideService.GetStridesByIterationAsync(iteration.Id))
                    .OrderBy(s => s.StartDate)
                    .ToList();

                if (iterationStrides.Count == 0) continue;
                if (!iterationStrides.All(s => s.EndDate.Date < now)) continue;

                var nextIterations = (await iterationService.GetIterationsByProjectAsync(iteration.ProjectId))
                    .OrderBy(i => i.Id)
                    .SkipWhile(i => i.Id <= iteration.Id)
                    .ToList();

                if (nextIterations.Count > 0) continue;

                var newIteration = new Iteration
                {
                    Name = $"Iteration {iteration.Id + 1}",
                    ProjectId = iteration.ProjectId,
                    CreatedAt = DateTime.UtcNow
                };
                await iterationService.AddAsync(newIteration);

                var lastStrideEnd = iterationStrides.Last().EndDate;
                for (var i = 0; i < 4; i++)
                {
                    var startDate = lastStrideEnd.AddDays(i * 14);
                    var stride = new Stride
                    {
                        Name = $"Stride {i + 1}",
                        IterationId = newIteration.Id,
                        StartDate = startDate,
                        EndDate = startDate.AddDays(14),
                        DurationDays = 14,
                        IsActive = i == 0,
                        CreatedAt = DateTime.UtcNow
                    };
                    await strideService.AddAsync(stride);
                }

                _logger.LogInformation(
                    "Auto-created iteration {IterationId} with 4 strides for project {ProjectId}",
                    newIteration.Id, iteration.ProjectId);
            }

            foreach (var stride in allStrides)
            {
                if (stride.EndDate.Date < now)
                {
                    _logger.LogInformation("Auto-progressing stride {StrideId}", stride.Id);
                    await momentService.MoveUnfinishedMomentsToNextStrideAsync(stride.Id);
                }
            }

            await strideService.SendDeadlineNotificationsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in stride automation");
        }
    }

    /// <summary>Stop the automation timer on service shutdown.</summary>
    /// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe.</param>
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    /// <summary>Dispose the automation timer.</summary>
    public void Dispose() => _timer?.Dispose();
}
