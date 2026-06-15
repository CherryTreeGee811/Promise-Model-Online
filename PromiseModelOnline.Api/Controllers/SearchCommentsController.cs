using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
        /// <param name="commentRepository">The comment repository.</param>
    /// <summary>REST controller for entity map search used in the comment linking UI.</summary>
    /// <remarks>
    ///   Provides a flattened entity hierarchy map (promises -> epics -> journeys -> flows -> moments)
    ///   for a given parent entity, used for entity linking in comments.
    ///   Requires <c>projects.read</c> policy.
    /// </remarks>
    [ApiController]
    [Route("api/comments")]
    public class SearchCommentsController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;

        public SearchCommentsController(ICommentRepository commentRepository)
        {
            _commentRepository = commentRepository;
        }

        /// <summary>Get the full entity map for a given parent entity.</summary>
        /// <param name="parentType">Entity type (<c>"promise"</c>, <c>"epic"</c>, <c>"journey"</c>, <c>"flow"</c>, <c>"moment"</c>).</param>
        /// <param name="parentId">The parent entity ID.</param>
        [Authorize(Policy = "projects.read")]
        [HttpGet("entity-map")]
        public async Task<ActionResult<IEnumerable<object>>> GetEntityMap(
            [FromQuery] string? parentType,
            [FromQuery] int parentId)
        {
            if (string.IsNullOrEmpty(parentType) || parentId <= 0)
                return Ok(Array.Empty<object>());

            try
            {
                var projectId = await _commentRepository.ResolveProjectIdAsync(parentType, parentId);

                var entityMap = new List<object>();

                var promises = await _commentRepository.GetPromisesByProjectAsync(projectId);
                entityMap.AddRange(promises.Select(p => new { EntityType = "promise", p.Id, p.SequenceNumber, p.StatusColor }));

                var promiseIds = promises.Select(p => p.Id).ToList();
                var epics = await _commentRepository.GetEpicsByPromiseIdsAsync(promiseIds);
                entityMap.AddRange(epics.Select(e => new { EntityType = "epic", e.Id, e.SequenceNumber, e.StatusColor }));

                var epicIds = epics.Select(e => e.Id).ToList();
                var journeys = await _commentRepository.GetJourneysByEpicIdsAsync(epicIds);
                entityMap.AddRange(journeys.Select(j => new { EntityType = "journey", j.Id, j.SequenceNumber, j.StatusColor }));

                var journeyIds = journeys.Select(j => j.Id).ToList();
                var flows = await _commentRepository.GetFlowsByJourneyIdsAsync(journeyIds);
                entityMap.AddRange(flows.Select(f => new { EntityType = "flow", f.Id, f.SequenceNumber, f.StatusColor }));

                var flowIds = flows.Select(f => f.Id).ToList();
                var moments = await _commentRepository.GetMomentsByFlowIdsAsync(flowIds);
                entityMap.AddRange(moments.Select(m => new { EntityType = "moment", m.Id, m.SequenceNumber, m.StatusColor }));

                return Ok(entityMap);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
