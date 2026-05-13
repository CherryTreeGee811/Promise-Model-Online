using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces
{
    public interface IProjectService : IGenericService<Project>
    {
        /// <summary>
        /// Returns projects owned by the user or shared with them (any permission, pending or active).
        /// </summary>
        Task<IEnumerable<Project>> GetAccessibleProjectsAsync(int userId);
    }
}