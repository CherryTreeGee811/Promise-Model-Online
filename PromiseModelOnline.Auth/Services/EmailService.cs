using SendGrid;
using SendGrid.Helpers.Mail;

namespace PromiseModelOnline.Auth.Services;

/// <summary>Sends transactional emails via SendGrid.</summary>
/// <remarks>
///   Reads the SendGrid API key from configuration or a Docker secret file.
///   Currently used for verification code emails with a styled HTML template.
/// </remarks>
public class EmailService : IEmailService
{
    private readonly string _apiKey;
    private readonly ILogger<EmailService> _logger;
    private const string FromEmail = "no-reply@promisemodel.online";
    private const string FromName = "Promise Model Online";

    /// <summary>Initialize the service with the SendGrid API key from config or secret file.</summary>
    /// <param name="configuration">The configuration for the SendGrid API key.</param>
    /// <param name="logger">The logger for diagnostic messages.</param>
    /// <exception cref="InvalidOperationException">SendGrid API key is not configured.</exception>
    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _logger = logger;

        var apiKey = configuration["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            var filePath = configuration["SendGrid:ApiKey_FILE"];
            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                apiKey = File.ReadAllText(filePath).Trim();
        }

        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException(
                "SendGrid:ApiKey is required. Set SENDGRID_API_KEY env var or mount sendgrid_api_key secret.");
        }

        if (!apiKey.StartsWith("SG."))
        {
            _logger.LogWarning(
                "SendGrid:ApiKey does not start with 'SG.' — key may be invalid. " +
                "Length: {Length}. File source: {FileExists}",
                apiKey.Length,
                !string.IsNullOrEmpty(configuration["SendGrid:ApiKey_FILE"])
                    && File.Exists(configuration["SendGrid:ApiKey_FILE"]!));
        }

        _apiKey = apiKey;
    }

    /// <summary>Compose and send a verification code email with a styled HTML template.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name for personalization.</param>
    /// <param name="verificationCode">The 6-digit verification code.</param>
    public async Task SendVerificationEmailAsync(string email, string username, string verificationCode)
    {
        try
        {
        var client = new SendGridClient(_apiKey);
        var from = new EmailAddress(FromEmail, FromName);
        var to = new EmailAddress(email, username);
        var subject = "Your verification code for Promise Model Online";

        var plainTextContent =
            $"Hi {username},\n\n" +
            $"Thank you for creating an account with Promise Model Online.\n\n" +
            $"Your verification code is: {verificationCode}\n\n" +
            $"Enter this code on the website to activate your account.\n" +
            $"This code expires in 24 hours.\n\n" +
            $"If you did not create this account, you can safely ignore this email.\n\n" +
            $"Thank you,\n" +
            $"The Promise Model Online Team\n" +
            $"Waterloo, Ontario, Canada";

        var spacedCode = string.Join(" ", verificationCode.ToCharArray());

        var htmlContent = $"""
            <!DOCTYPE html>
            <html lang="en-CA">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your verification code</title></head>
            <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="padding:40px 36px 32px;">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">Promise Model Online</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;text-align:center;">Your verification code</p>
            <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.6;">Hi {username},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.6;">Thank you for creating an account. Use the code below to activate your account:</p>
            <div style="text-align:center;margin:28px 0;padding:20px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;font-family:Consolas,'Courier New',monospace;">{spacedCode}</span>
            </div>
            <p style="margin:0 0 20px;font-size:13px;color:#475569;line-height:1.5;">On the verification page, enter the 6-digit code shown above. This code expires in 24 hours.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">If you did not create this account, you can safely ignore this email.</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Promise Model Online &bull; Waterloo, Ontario, Canada</p>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From = from,
            Subject = subject,
            PlainTextContent = plainTextContent,
            HtmlContent = htmlContent
        };
        msg.AddTo(to);

        msg.SetClickTracking(false, false);
        msg.SetOpenTracking(false);
        msg.SetGoogleAnalytics(false);
        msg.SetSubscriptionTracking(false);

        var response = await client.SendEmailAsync(msg);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync();
            _logger.LogWarning(
                "SendGrid returned {StatusCode} when sending verification to {Email}. Body: {Body}",
                (int)response.StatusCode, email, body);
        }
    }
    catch (Exception ex)
    {
        _logger.LogWarning(ex, "SendGrid unavailable — verification email to {Email} not sent", email);
    }
}

    /// <summary>Send a password reset email with a secure reset link.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name for personalization.</param>
    /// <param name="resetLink">The full URL to the password reset page with token.</param>
    public async Task SendResetPasswordEmailAsync(string email, string username, string resetLink)
    {
        var client = new SendGridClient(_apiKey);
        var from = new EmailAddress(FromEmail, FromName);
        var to = new EmailAddress(email, username);
        var subject = "Reset your Promise Model Online password";

        var plainTextContent =
            $"Hi {username},\n\n" +
            $"We received a request to reset your password.\n\n" +
            $"Click the link below to reset your password:\n{resetLink}\n\n" +
            $"This link expires in 1 hour.\n\n" +
            $"If you did not request a password reset, you can safely ignore this email.\n\n" +
            $"Thank you,\n" +
            $"The Promise Model Online Team\n" +
            $"Waterloo, Ontario, Canada";

        var htmlContent = $"""
            <!DOCTYPE html>
            <html lang="en-CA">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset your password</title></head>
            <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="padding:40px 36px 32px;">
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">Promise Model Online</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;text-align:center;">Password reset request</p>
            <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.6;">Hi {username},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align:center;margin:28px 0;">
                <a href="{resetLink}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;background-color:#4f46e5;border-radius:8px;text-decoration:none;">Reset Password</a>
            </div>
            <p style="margin:0 0 20px;font-size:13px;color:#475569;line-height:1.5;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Promise Model Online &bull; Waterloo, Ontario, Canada</p>
            </body>
            </html>
            """;

        var msg = new SendGridMessage
        {
            From = from,
            Subject = subject,
            PlainTextContent = plainTextContent,
            HtmlContent = htmlContent
        };
        msg.AddTo(to);

        msg.SetClickTracking(false, false);
        msg.SetOpenTracking(false);
        msg.SetGoogleAnalytics(false);
        msg.SetSubscriptionTracking(false);

        var response = await client.SendEmailAsync(msg);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync();
            _logger.LogWarning(
                "SendGrid returned {StatusCode} when sending reset email to {Email}. Body: {Body}",
                (int)response.StatusCode, email, body);
        }
    }
}
