namespace PromiseModelOnline.Auth.Services;

/// <summary>
/// Fallback email service used when SendGrid is not configured.
/// Logs a warning on each call so admins know email features are unavailable.
/// </summary>
public class NoOpEmailService(ILogger<NoOpEmailService> logger) : IEmailService
{
    public Task SendVerificationEmailAsync(string email, string username, string verificationCode)
    {
        logger.LogWarning(
            "SendGrid not configured. Email verification would have been sent to {Email} for user {Username} with code {Code}.",
            email, username, verificationCode);
        return Task.CompletedTask;
    }
}
