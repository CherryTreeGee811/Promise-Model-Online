namespace PromiseModelOnline.Auth.Services;

/// <summary>Contract for sending transactional email notifications.</summary>
public interface IEmailService
{
    /// <summary>Send a verification code email to a user.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name for personalization.</param>
    /// <param name="verificationCode">The 6-digit verification code.</param>
    Task SendVerificationEmailAsync(string email, string username, string verificationCode);
}
