using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Repositories.Interfaces;

public interface IProjectRepository : IRepository<Project>
{
    Task<List<Project>> GetProjectsByOwnerAsync(int ownerId, int skip, int take);
    Task<int> CountProjectsByOwnerAsync(int ownerId);
    Task<Project?> GetProjectWithPromisesAsync(int id);
}
