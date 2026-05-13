using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Mappers
{
    public class PermissionMapper : IGenericMapper<Permission, PermissionDTO>
    {
        public PermissionDTO Map(Permission source, IGenericService<Permission>? service = null)
        {
            return new PermissionDTO
            {
                Id = source.Id,
                UserId = source.UserId,
                UserName = source.User?.Name ?? "Unknown",
                ProjectId = source.ProjectId,
                Level = source.Level.ToString(),
                Status = source.Status.ToString()
            };
        }
    }
}