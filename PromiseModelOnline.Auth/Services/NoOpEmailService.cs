namespace PromiseModelOnline.Auth.Services;

/// <summary>
/// Fallback email service used when SendGrid is not configured.
/// Logs a warning on each call so admins know email features are unavailable.
/// </summary>
public class NoOpEmailService(ILogger<NoOpEmailService> logger) : IEmailService
{
    /// <summary>Log a warning that a verification email would have been sent.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name.</param>
    /// <param name="verificationCode">The 6-digit verification code.</param>
    public Task SendVerificationEmailAsync(string email, string username, string verificationCode)
    {
        logger.LogWarning(
            "SendGrid not configured. Email verification would have been sent to {Email} for user {Username} with code {Code}.",
            email, username, verificationCode);
        return Task.CompletedTask;
    }

    /// <summary>Log a warning that a password reset email would have been sent.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name.</param>
    /// <param name="resetLink">The full reset-link URL with embedded token.</param>
    public Task SendResetPasswordEmailAsync(string email, string username, string resetLink)
    {
        logger.LogWarning(
            "SendGrid not configured. Password reset email would have been sent to {Email} for user {Username}. Reset link: {ResetLink}.",
            email, username, resetLink);
        return Task.CompletedTask;
    }
}
