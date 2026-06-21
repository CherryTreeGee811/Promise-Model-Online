using Microsoft.Extensions.Logging;
using PromiseModelOnline.Auth.Services;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class StubEmailService(ILogger<StubEmailService> logger) : IEmailService
{
    private readonly ILogger<StubEmailService> _logger = logger;

    public Task SendVerificationEmailAsync(string email, string username, string verificationCode)
    {
        _logger.LogInformation(
            "[StubEmailService] Would send verification code {Code} to {Email} ({Username})",
            verificationCode, email, username);
        return Task.CompletedTask;
    }
}
