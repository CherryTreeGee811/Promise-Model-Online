using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface ILoginRepository
    {
        Task<TokenResponse> LoginAsync(UserLogin userLogin);
    }
}