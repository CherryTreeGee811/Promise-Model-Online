using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Services;

/// <summary>Sends invitation notification emails via SendGrid.</summary>
public class InvitationEmailService : IInvitationEmailService
{
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly ILogger<InvitationEmailService> _logger;
    private const string FromEmail = "no-reply@promisemodel.online";
    private const string FromName = "Promise Model Online";
#pragma warning disable S1075 // URIs should not be hardcoded — this is a fallback for deployments without APP_BASE_URL
    private const string DefaultBaseUrl = "https://localhost:9000";
#pragma warning restore S1075

    /// <summary>Initializes the email service with SendGrid API key and app base URL from configuration.</summary>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="logger">Logger instance.</param>
    public InvitationEmailService(IConfiguration configuration, ILogger<InvitationEmailService> logger)
    {
        _logger = logger;
        _baseUrl = (configuration["App:BaseUrl"] ?? configuration["APP_BASE_URL"] ?? DefaultBaseUrl).TrimEnd('/');

        var apiKey = configuration["SendGrid:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            var filePath = configuration["SendGrid:ApiKey_FILE"];
            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                apiKey = File.ReadAllText(filePath).Trim();
        }

        _apiKey = apiKey ?? string.Empty;
    }

    /// <summary>Creates a SendGrid client. Override for testing.</summary>
    protected virtual ISendGridClient CreateSendGridClient() => new SendGridClient(_apiKey);

    /// <summary>Sends an invitation email via SendGrid.</summary>
    /// <param name="email">Recipient email address.</param>
    /// <param name="username">Recipient display name.</param>
    /// <param name="projectName">Name of the project.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    public async Task SendInvitationEmailAsync(string email, string username, string projectName, CancellationToken cancellationToken = default)
    {
        var acceptUrl = $"{_baseUrl}/invitations";
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("SendGrid API key not configured — invitation email to {Email} not sent", email);
            return;
        }

        try
        {
            var client = CreateSendGridClient();
            var from = new EmailAddress(FromEmail, FromName);
            var to = new EmailAddress(email, username);
            var subject = $"You've been invited to {projectName} on Promise Model Online";

            var plainTextContent =
                $"Hi {username},\n\n" +
                $"You have been invited to join the project '{projectName}' on Promise Model Online.\n\n" +
                $"Accept your invitation here:\n{acceptUrl}\n\n" +
                $"Thank you,\n" +
                $"The Promise Model Online Team";

            var htmlContent = $"""
                <!DOCTYPE html>
                <html lang="en-CA">
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>You're invited!</title></head>
                <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td style="padding:32px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="padding:40px 36px 32px;">
                <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">Promise Model Online</h1>
                <p style="margin:0 0 24px;font-size:14px;color:#475569;text-align:center;">Project invitation</p>
                <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.6;">Hi {username},</p>
                <p style="margin:0 0 24px;font-size:15px;color:#0f172a;line-height:1.6;">You have been invited to join the project <strong>{projectName}</strong>.</p>
                <div style="text-align:center;margin:28px 0;">
                    <a href="{acceptUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;background-color:#4f46e5;border-radius:8px;text-decoration:none;">View Invitation</a>
                </div>
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

            var response = await client.SendEmailAsync(msg, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Body.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("SendGrid returned {StatusCode} when sending invitation to {Email}. Body: {Body}", (int)response.StatusCode, email, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SendGrid unavailable — invitation email to {Email} not sent", email);
        }
    }
}
