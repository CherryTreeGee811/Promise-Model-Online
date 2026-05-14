using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Extensions;

public static class StrideAutomationExtensions
{
    /// <summary>
    /// Registers the hosted service that auto‑progresses strides and sends deadline notifications.
    /// </summary>
    public static IServiceCollection AddStrideAutomation(this IServiceCollection services)
    {
        services.AddHostedService<StrideAutomationService>();
        return services;
    }
}

/// <summary>
/// Background service that runs every hour:
/// - Moves unfinished moments out of ended strides.
/// - Sends deadline notifications 3 days before a stride ends.
/// </summary>
internal class StrideAutomationService : IHostedService, IDisposable
{
    private Timer? _timer;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<StrideAutomationService> _logger;

    public StrideAutomationService(IServiceScopeFactory scopeFactory,
                                   ILogger<StrideAutomationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stride automation service started.");
        _timer = new Timer(async _ => await DoWorkAsync(), null,
            TimeSpan.Zero, TimeSpan.FromHours(1));
        return Task.CompletedTask;
    }

    private async Task DoWorkAsync()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var strideService = scope.ServiceProvider.GetRequiredService<IStrideService>();
            var momentService = scope.ServiceProvider.GetRequiredService<IMomentService>();

            var now = DateTime.UtcNow.Date;

            // Progress ended strides
            var allStrides = await strideService.GetAllAsync();
            foreach (var stride in allStrides)
            {
                if (stride.EndDate.Date < now)
                {
                    _logger.LogInformation("Auto‑progressing stride {StrideId}", stride.Id);
                    await momentService.MoveUnfinishedMomentsToNextStrideAsync(stride.Id);
                }
            }

            // Send deadline notifications
            await strideService.SendDeadlineNotificationsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in stride automation");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose() => _timer?.Dispose();
}