using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System.Linq;
using System.Threading.Tasks;
namespace PromiseModelOnline.Api.Controllers;

/// <summary>Endpoints for project dependency/graph data.</summary>
/// <remarks>Initializes a new instance of the <see cref="ProjectGraphController"/> class.</remarks>
/// <param name="context">The database context for data access.</param>
/// <param name="projectService">The service for project operations.</param>
[Route("api/projects/{owner}/{project}/graph")]
public class ProjectGraphController(
    IProjectService projectService,
    IPromiseModelOnlineContext context) : ProjectScopedControllerBase(projectService)
{
    private readonly IPromiseModelOnlineContext _context = context;

    /// <summary>Retrieves the full project hierarchy as a graph structure.</summary>
    /// <param name="owner">The owner slug.</param>
    /// <param name="project">The project slug.</param>
    /// <returns>The project graph DTO containing the full hierarchy.</returns>
    [Authorize(Policy = "projects.read")]
    [HttpGet]
    public async Task<ActionResult<ProjectGraphDto>> GetGraph(string owner, string project, CancellationToken cancellationToken = default)
    {
        var projectEntity = await ResolveProjectAsync(owner, project, cancellationToken);
        if (projectEntity is null)
            return NotFound();

        var graph = await _context.Projects
            .Where(p => p.Id == projectEntity.Id)
            .Select(p => new ProjectGraphDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                OwnerId = p.OwnerId,
                OwnerSlug = p.Owner.Slug,
                CreatedAt = p.CreatedAt,
                Promises = p.ProductPromises
                    .OrderBy(promise => promise.DisplayOrder)
                    .Select(promise => new PromiseGraphDto
                    {
                        Id = promise.Id,
                        Type = "Promise",
                        Statement = promise.Statement,
                        Description = promise.Description,
                        ProjectId = promise.ProjectId,
                        OwnerId = promise.OwnerId,
                        SequenceNumber = promise.SequenceNumber,
                        DisplayOrder = promise.DisplayOrder,
                        StatusColor = promise.StatusColor,
                        CreatedAt = promise.CreatedAt,
                        UpdatedAt = promise.UpdatedAt,
                        Epics = promise.Epics
                            .OrderBy(epic => epic.DisplayOrder)
                            .Select(epic => new EpicGraphDto
                            {
                                Id = epic.Id,
                                Type = "Epic",
                                Statement = epic.Statement,
                                Description = epic.Description,
                                ProductPromiseId = epic.ProductPromiseId,
                                OwnerId = epic.OwnerId,
                                SequenceNumber = epic.SequenceNumber,
                                DisplayOrder = epic.DisplayOrder,
                                StatusColor = epic.StatusColor,
                                CreatedAt = epic.CreatedAt,
                                UpdatedAt = epic.UpdatedAt,
                                Journeys = epic.Journeys
                                    .OrderBy(journey => journey.DisplayOrder)
                                    .Select(journey => new JourneyGraphDto
                                    {
                                        Id = journey.Id,
                                        Type = "Journey",
                                        Statement = journey.Statement,
                                        Description = journey.Description,
                                        EpicId = journey.EpicId,
                                        OwnerId = journey.OwnerId,
                                        SequenceNumber = journey.SequenceNumber,
                                        DisplayOrder = journey.DisplayOrder,
                                        StatusColor = journey.StatusColor,
                                        CreatedAt = journey.CreatedAt,
                                        UpdatedAt = journey.UpdatedAt,
                                        Flows = journey.Flows
                                            .OrderBy(flow => flow.DisplayOrder)
                                            .Select(flow => new FlowGraphDto
                                            {
                                                Id = flow.Id,
                                                Type = "Flow",
                                                Statement = flow.Statement,
                                                Description = flow.Description,
                                                JourneyId = flow.JourneyId,
                                                OwnerId = flow.OwnerId,
                                                SequenceNumber = flow.SequenceNumber,
                                                DisplayOrder = flow.DisplayOrder,
                                                StatusColor = flow.StatusColor,
                                                CreatedAt = flow.CreatedAt,
                                                UpdatedAt = flow.UpdatedAt,
                                                Moments = flow.Moments
                                                    .OrderBy(moment => moment.DisplayOrder)
                                                    .Select(moment => new MomentDto
                                                    {
                                                        Id = moment.Id,
                                                        Statement = moment.Statement,
                                                        Description = moment.Description,
                                                        FlowId = moment.FlowId,
                                                        Type = moment.Type,
                                                        Status = moment.Status,
                                                        EffortEstimate = moment.EffortEstimate,
                                                        OwnerId = moment.OwnerId,
                                                        AssignedStrideId = moment.AssignedStrideId,
                                                        SequenceNumber = moment.SequenceNumber,
                                                        DisplayOrder = moment.DisplayOrder,
                                                        CreatedAt = moment.CreatedAt,
                                                        UpdatedAt = moment.UpdatedAt,
                                                        CompletedAt = moment.CompletedAt,
                                                        IsZombie = moment.IsZombie,
                                                        OriginalStrideId = moment.OriginalStrideId,
                                                        StatusColor = moment.StatusColor,
                                                    }).ToList()
                                            }).ToList()
                                    }).ToList()
                            }).ToList()
                    }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (graph is null)
            return NotFound();

        return Ok(graph);
    }
}
