using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.DAL
{
    public class PermissionRepository : GenericRepository<Permission>, IPermissionRepository
    {
        public PermissionRepository(PromiseModelOnlineContext context) : base(context) { }

        public async Task<IEnumerable<Permission>> GetPermissionsByProjectAsync(int projectId)
        {
            return await _context.Set<Permission>()
                .Include(p => p.User)
                .Where(p => p.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Permission>> GetPendingInvitationsForUserAsync(int userId)
        {
            return await _dbSet
                .Include(p => p.Project)
                .Where(p => p.UserId == userId && p.Status == PermissionStatus.Pending)
                .ToListAsync();
        }

        public async Task<Permission?> GetByUserAndProjectAsync(int userId, int projectId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ProjectId == projectId);
        }
    }
}