using PromiseModelOnline.Api.DTOs;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

public interface IProjectImportService
{
    Task<ProjectImportResult> ImportAsync(ProjectExportDocument document, int requestedByUserId);
}