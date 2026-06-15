using Microsoft.EntityFrameworkCore;
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

        public async Task<User?> GetBySlugAsync(string slug)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Slug == slug);
        }

        public async Task<User> GetOrCreateUserByEmailAsync(string email, string? username = null)
        {
            var users = await FindByEmailAsync(email);
            var existing = users.FirstOrDefault();

            if (existing is not null)
            {
                if (!string.IsNullOrEmpty(username))
                {
                    if (existing.Name == existing.Email)
                    {
                        existing.Name = username;
                    }

                    if (string.IsNullOrEmpty(existing.Slug))
                    {
                        existing.Slug = username;
                    }
                }

                if (!string.IsNullOrEmpty(username) && existing.Name == existing.Email)
                {
                    existing.Name = username;
                    Update(existing);
                    await SaveChangesAsync();
                }
                else if (string.IsNullOrEmpty(existing.Slug) && !string.IsNullOrEmpty(username))
                {
                    Update(existing);
                    await SaveChangesAsync();
                }

                return existing;
            }

            var baseSlug = username ?? (!string.IsNullOrEmpty(email) && email.Contains('@') ? email.Split('@')[0] : email ?? "Unknown");
            var slug = baseSlug;
            var counter = 1;
            while (await _dbSet.AnyAsync(u => u.Slug == slug))
            {
                slug = $"{baseSlug}_{counter}";
                counter++;
            }

            var user = new User
            {
                Email = email ?? string.Empty,
                Name = username ?? (!string.IsNullOrEmpty(email) && email.Contains('@') ? email.Split('@')[0] : email ?? "Unknown"),
                Slug = slug,
                Role = UserRole.Professional,
                CreatedAt = DateTime.UtcNow
            };
            await AddAsync(user);
            await SaveChangesAsync();
            return user;
        }

        public async Task<IEnumerable<User>> SearchUsersByProjectAsync(int projectId, string searchTerm, int maxResults = 5)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return Enumerable.Empty<User>();

            var project = await _context.Set<Project>().FindAsync(projectId);
            var ownerId = project?.OwnerId;

            var userIds = await _context.Set<Permission>()
                .Where(p => p.ProjectId == projectId && p.Status == PermissionStatus.Active)
                .Select(p => p.UserId)
                .Distinct()
                .ToListAsync();

            if (ownerId.HasValue && !userIds.Contains(ownerId.Value))
                userIds.Add(ownerId.Value);

            return await _dbSet
                .Where(u => userIds.Contains(u.Id) && u.Name.ToLower().Contains(searchTerm.ToLower()))
                .Take(maxResults)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, int maxResults = 10)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return Enumerable.Empty<User>();

            var lower = searchTerm.ToLower();
            return await _dbSet
                .Where(u => u.Name.ToLower().Contains(lower) || u.Email.ToLower().Contains(lower))
                .Take(maxResults)
                .ToListAsync();
        }
    }
}