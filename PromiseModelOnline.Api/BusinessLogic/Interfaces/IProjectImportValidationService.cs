using PromiseModelOnline.Api.DTOs;
using System.IO;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.BusinessLogic.Interfaces;

public interface IProjectImportValidationService
{
    Task<ProjectImportValidationResult> ValidateAsync(Stream jsonStream);
}