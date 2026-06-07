using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly IUserRepository _userRepository;
        private readonly ICommentRepository _commentRepository;

        public CommentsController(ICommentService commentService,
                                  IUserRepository userRepository,
                                  ICommentRepository commentRepository)
        {
            _commentService = commentService;
            _userRepository = userRepository;
            _commentRepository = commentRepository;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CommentDTO>>> GetComments(
            [FromQuery] string? type,
            [FromQuery] int parentId)
        {
            if (string.IsNullOrEmpty(type) || parentId <= 0)
                return BadRequest("Type and parentId are required.");

            var comments = await _commentService.GetCommentsAsync(type, parentId);
            return Ok(comments);
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<CommentDTO>> CreateComment([FromBody] CreateCommentDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Text))
                return BadRequest("Comment text cannot be empty.");

            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(email))
                return Unauthorized("Missing email claim");

            var username = User.FindFirst("nameid")?.Value;

            try
            {
                var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);
                var comment = await _commentService.CreateCommentAsync(dto, user.Id);

                return CreatedAtAction(nameof(GetComments),
                    new { type = dto.ParentType, parentId = dto.ParentId }, comment);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
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
    }
}
