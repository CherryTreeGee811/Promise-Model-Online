using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IProjectService : IGenericService<Project>
    {
        /// <summary>
        /// Returns projects owned by the user or shared with them (any permission, pending or active).
        /// </summary>
        Task<IEnumerable<Project>> GetAccessibleProjectsAsync(int userId);

        Task<IEnumerable<ProjectMemberDTO>> GetProjectMembersAsync(int projectId);

        Task<IEnumerable<Promise>> GetProductPromisesAsync(int projectId);
    }
}