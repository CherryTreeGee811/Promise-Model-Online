namespace PromiseModelOnline.Auth.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string username, string verificationCode);
}
