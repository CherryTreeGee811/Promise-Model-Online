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
<<<<<<< HEAD

        Task<IEnumerable<User>> SearchUsersByProjectAsync(int projectId, string searchTerm, int maxResults = 5);

        Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, int maxResults = 10);

        Task<User?> GetBySlugAsync(string slug);
||||||| 1bedf4f
=======
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}