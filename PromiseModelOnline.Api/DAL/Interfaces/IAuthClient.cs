namespace PromiseModelOnline.Api.DAL.Interfaces;

public interface IAuthClient
{
    /// <summary>
    /// Ensure the seed user exists in the Auth service. Returns true if created or already exists.
    /// </summary>
    Task<bool> EnsureSeedUserAsync(string userName, string email, string password);
}
