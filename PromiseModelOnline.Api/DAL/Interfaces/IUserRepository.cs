using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL.Interfaces
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<IEnumerable<User>> GetUsersByNameAsync(string name);

        Task<IEnumerable<User>> FindByEmailAsync(string email);

        Task<User> GetOrCreateUserByEmailAsync(string email, string? username = null);
    }
}