using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [ApiController]
    [Route("api/comments")]
    public class SearchCommentsController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IUserRepository _userRepository;
        private readonly IGenericService<Promise> _promiseService;
        private readonly IPromiseModelOnlineContext _context;

        public SearchCommentsController(
            ICommentRepository commentRepository,
            IUserRepository userRepository,
            IGenericService<Promise> promiseService,
            IPromiseModelOnlineContext context)
        {
            _commentRepository = commentRepository;
            _userRepository = userRepository;
            _promiseService = promiseService;
            _context = context;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("search-users")]
        public async Task<ActionResult<IEnumerable<object>>> SearchUsers(
            [FromQuery] string? parentType,
            [FromQuery] int parentId,
            [FromQuery] string? search)
        {
            if (string.IsNullOrEmpty(parentType) || parentId <= 0 || string.IsNullOrWhiteSpace(search))
                return Ok(Array.Empty<object>());

            try
            {
                var projectId = await _commentRepository.ResolveProjectIdAsync(parentType, parentId);
                var users = await _userRepository.SearchUsersByProjectAsync(projectId, search);
                var result = users.Select(u => new { u.Id, u.Name });
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("search-promises")]
        public async Task<ActionResult<IEnumerable<object>>> SearchPromises(
            [FromQuery] string? parentType,
            [FromQuery] int parentId,
            [FromQuery] string? search)
        {
            if (string.IsNullOrEmpty(parentType) || parentId <= 0 || string.IsNullOrWhiteSpace(search))
                return Ok(Array.Empty<object>());

            try
            {
                var projectId = await _commentRepository.ResolveProjectIdAsync(parentType, parentId);
                var stackResults = await _commentRepository.SearchStackByStatementAsync(projectId, search);
                var result = stackResults.Select(r => new { r.EntityType, r.Id, r.SequenceNumber, r.Statement });
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

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
