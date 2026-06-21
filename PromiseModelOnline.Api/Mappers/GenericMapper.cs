using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PMO.Core.Models;
using System.Linq;

namespace PromiseModelOnline.Api.Mappers;

/// <summary>Convention-based mapper that copies matching properties by name and type, with special-case overrides for complex types.</summary>
/// <remarks>
///   Uses reflection to copy properties from <typeparamref name="TSource"/> to
///   <typeparamref name="TDestination"/> when both name and type match.
///   Special handling exists for <see cref="Moment"/> to <see cref="MomentDto"/> (populates sub-tasks),
///   <see cref="Project"/> to <see cref="ProjectDto"/> (populates owner slug), and
///   <see cref="Notification"/> to <see cref="NotificationDto"/> (converts enum to string).
/// </remarks>
/// <typeparam name="TSource">The source entity type.</typeparam>
/// <typeparam name="TDestination">The destination DTO type.</typeparam>
public class GenericMapper<TSource, TDestination> : IGenericMapper<TSource, TDestination>
    where TSource : class
    where TDestination : class, new()
{
    /// <summary>Map a source entity to a destination DTO by convention with special-case overrides.</summary>
    /// <param name="source">The source entity. Not null.</param>
    /// <param name="service">The generic service for resolving related data.</param>
    /// <returns>The mapped destination DTO.</returns>
    public TDestination Map(TSource source, IGenericService<TSource> service)
    {
        var destination = new TDestination();
        var sourceProps = typeof(TSource).GetProperties();
        var destProps = typeof(TDestination).GetProperties();
        foreach (var sProp in sourceProps)
        {
            var dProp = System.Array.Find(destProps, p => p.Name == sProp.Name && p.PropertyType == sProp.PropertyType);
            if (dProp != null && dProp.CanWrite)
            {
                dProp.SetValue(destination, sProp.GetValue(source));
            }
        }

        if (source is Moment moment && destination is MomentDto momentDto)
        {
            momentDto.Tasks = (moment.Tasks ?? [])
                .Select(task => new MomentTaskDto
                {
                    Id = task.Id,
                    Name = task.Name,
                    Description = task.Description,
                    MomentId = task.MomentId,
                    OwnerId = task.OwnerId,
                    IsCompleted = task.IsCompleted,
                    CreatedAt = task.CreatedAt,
                    CompletedAt = task.CompletedAt,
                })
                .ToList();
        }

        if (source is Project project && destination is ProjectDto projectDto)
        {
            projectDto.OwnerSlug = project.Owner?.Slug ?? "";
        }

        if (source is Notification notification && destination is NotificationDto notificationDto)
        {
            notificationDto.Type = notification.Type.ToString();
        }
        return destination;
    }
}
