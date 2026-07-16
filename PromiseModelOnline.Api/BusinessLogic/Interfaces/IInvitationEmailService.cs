using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Service for sending invitation emails via SendGrid.</summary>
public interface IInvitationEmailService
{
    /// <summary>Send an invitation email to a user.</summary>
    /// <param name="email">The recipient's email address.</param>
    /// <param name="username">The recipient's display name.</param>
    /// <param name="projectName">The name of the project they were invited to.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task SendInvitationEmailAsync(string email, string username, string projectName, CancellationToken cancellationToken = default);
}
