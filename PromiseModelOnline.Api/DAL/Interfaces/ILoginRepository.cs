using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface ILoginRepository
    {
        Task<string> LoginAsync(UserLogin userLogin);
    }
}