using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace PromiseModelOnline.Api.DAL
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<User>> GetUsersByNameAsync(string name)
        {
            return await FindAsync(u => u.Name == name);
        }

        public async Task<IEnumerable<User>> FindByEmailAsync(string email)
            => await FindAsync(u => u.Email == email);

        public async Task<User> GetOrCreateUserByEmailAsync(string email, string? username = null)
        {
            var users = await FindByEmailAsync(email);
            var existing = users.FirstOrDefault();

            if (existing is not null)
            {
                // Update name if we now have a real username and the stored name is still an email
                if (!string.IsNullOrEmpty(username) && existing.Name == existing.Email)
                {
                    existing.Name = username;
                    Update(existing);
                    await SaveChangesAsync();
                }
                return existing;
            }

            var user = new User
            {
                Email = email,
                Name = username ?? (email?.Contains('@') == true ? email.Split('@')[0] : email),
                Role = UserRole.Professional,
                CreatedAt = DateTime.UtcNow
            };
            await AddAsync(user);
            await SaveChangesAsync();
            return user;
        }
    }
}