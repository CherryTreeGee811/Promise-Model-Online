using System.Threading;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

/// <summary>Lookup result from the auth system's Identity database.</summary>
public class AuthUserInfo
{
    /// <summary>The user's auth UserName (IdentityUser.UserName).</summary>
    public required string UserName { get; set; }

    /// <summary>The user's email address.</summary>
    public required string Email { get; set; }
}

/// <summary>Service for looking up users registered in the auth system (PromiseModelOnlineAuth) by username or email.</summary>
public interface IAuthUserLookupService
{
    /// <summary>Search the auth DB by username or email (case-insensitive exact match on normalized values).</summary>
    /// <param name="searchTerm">Username or email to search for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The matching auth user, or <c>null</c> if not found.</returns>
    Task<AuthUserInfo?> FindByUsernameOrEmailAsync(string searchTerm, CancellationToken cancellationToken = default);
}
