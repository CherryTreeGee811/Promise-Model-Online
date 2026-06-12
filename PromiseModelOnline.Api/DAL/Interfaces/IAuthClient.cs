namespace PromiseModelOnline.Api.DAL.Interfaces;

public interface IAuthClient
{
    Task<PromiseModelOnline.Api.Models.TokenResponse> LoginAsync(PromiseModelOnline.Api.Models.UserLogin userLogin);

    Task<PromiseModelOnline.Api.Models.RegisterResponse?> RegisterAsync(PromiseModelOnline.Api.Models.RegisterRequest request);

    Task<PromiseModelOnline.Api.Models.TokenResponse> RefreshAsync(PromiseModelOnline.Api.Models.RefreshRequest request);

    Task LogoutAsync(PromiseModelOnline.Api.Models.LogoutRequest? request, string authorizationHeader);

    Task ChangePasswordAsync(PromiseModelOnline.Api.Models.ChangePasswordRequest request, string authorizationHeader);

    Task DeleteAccountAsync(PromiseModelOnline.Api.Models.DeleteAccountRequest request, string authorizationHeader);

    /// <summary>
    /// Ensure the seed user exists in the Auth service. Returns true if created or already exists.
    /// </summary>
    Task<bool> EnsureSeedUserAsync(string userName, string email, string password);
}
