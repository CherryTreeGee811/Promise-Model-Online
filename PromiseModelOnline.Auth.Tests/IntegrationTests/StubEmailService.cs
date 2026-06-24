using Microsoft.Extensions.Logging;
using PromiseModelOnline.Auth.Services;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Stub email service for integration tests. Logs email events but does not send real messages.</summary>
public class StubEmailService(ILogger<StubEmailService> logger) : IEmailService
{
    private readonly ILogger<StubEmailService> _logger = logger;

    /// <summary>Log a verification code that would have been sent.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name.</param>
    /// <param name="verificationCode">The 6-digit verification code.</param>
    public Task SendVerificationEmailAsync(string email, string username, string verificationCode)
    {
        _logger.LogInformation(
            "[StubEmailService] Would send verification code {Code} to {Email} ({Username})",
            verificationCode, email, username);
        return Task.CompletedTask;
    }

    /// <summary>Log a password reset link that would have been sent.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name.</param>
    /// <param name="resetLink">The full reset-link URL with embedded token.</param>
    public Task SendResetPasswordEmailAsync(string email, string username, string resetLink)
    {
        _logger.LogInformation(
            "[StubEmailService] Would send password reset link to {Email} ({Username}): {ResetLink}",
            email, username, resetLink);
        return Task.CompletedTask;
    }
}
