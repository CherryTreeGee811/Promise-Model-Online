namespace PromiseModelOnline.Auth.Services;

/// <summary>Contract for sending transactional email notifications.</summary>
public interface IEmailService
{
    /// <summary>Send a verification code email to a user.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name for personalization.</param>
    /// <param name="verificationCode">The 6-digit verification code.</param>
    Task SendVerificationEmailAsync(string email, string username, string verificationCode);

    /// <summary>Send a password reset email with a reset link.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name for personalization.</param>
    /// <param name="resetLink">The full URL to the password reset page with token.</param>
    Task SendResetPasswordEmailAsync(string email, string username, string resetLink);
}
