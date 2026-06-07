using Microsoft.Extensions.Logging;
using PromiseModelOnline.Auth.Services;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class StubEmailService : IEmailService
{
    private readonly ILogger<StubEmailService> _logger;

    public StubEmailService(ILogger<StubEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendVerificationEmailAsync(string email, string username, string verificationCode)
    {
        _logger.LogInformation(
            "[StubEmailService] Would send verification code {Code} to {Email} ({Username})",
            verificationCode, email, username);
        return Task.CompletedTask;
    }
}
