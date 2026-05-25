using PromiseModelOnline.Api.DTOs;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

public interface IProjectExportService
{
    Task<ProjectExportDocument> BuildExportAsync(int projectId);
}