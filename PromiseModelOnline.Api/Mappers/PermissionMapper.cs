using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Mappers
{
        /// <param name="service">The service for resolving related data.</param>
    /// <summary>Maps <see cref="Permission"/> entities to <see cref="PermissionDTO"/> with explicit property mapping.</summary>
        /// <param name="source">The source entity to map.</param>
    /// <remarks>
    ///   Resolves the user name from the navigation property and converts enum values to strings.
    /// </remarks>
    public class PermissionMapper : IGenericMapper<Permission, PermissionDTO>
    {
        /// <summary>Map a permission entity to a permission DTO.</summary>
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
