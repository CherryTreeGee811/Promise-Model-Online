using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("api/projects/{owner}/{project}/epics")]
    public class ProjectEpicsController : ProjectScopedControllerBase
    {
        private readonly IGenericService<Epic> _service;
        private readonly IGenericMapper<Epic, EpicDTO> _mapper;
        private readonly IPromiseModelOnlineContext _context;

        public ProjectEpicsController(
            IGenericService<Epic> service,
            IGenericMapper<Epic, EpicDTO> mapper,
            IPromiseModelOnlineContext context,
            IProjectService projectService)
            : base(projectService)
        {
            _service = service;
            _mapper = mapper;
            _context = context;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EpicDTO>>> GetAll(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            IEnumerable<Epic> epics;

            var promiseSeqStr = Request.Query["promiseSeq"];
            if (!string.IsNullOrEmpty(promiseSeqStr) && int.TryParse(promiseSeqStr, out int promiseSeq))
            {
                var promise = await _context.Promises
                    .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.SequenceNumber == promiseSeq);

                if (promise is null)
                    return NotFound("Promise not found.");

                epics = await _context.Epics
                    .Where(e => e.ProductPromiseId == promise.Id)
                    .ToListAsync();
            }
            else
            {
                epics = await _context.Epics
                    .Where(e => e.ProductPromise.ProjectId == projectEntity.Id)
                    .ToListAsync();
            }

            var result = new List<EpicDTO>();
            foreach (var epic in epics)
                result.Add(_mapper.Map(epic, _service));

            return Ok(result);
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("{seq}")]
        public async Task<ActionResult<EpicDTO>> GetBySeq(int seq, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var epic = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq);

            if (epic is null)
                return NotFound();

            return Ok(_mapper.Map(epic, _service));
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("by-id/{id}")]
        public async Task<ActionResult<EpicDTO>> GetById(int id, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var epic = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.Id == id);

            if (epic is null)
                return NotFound();

            return Ok(_mapper.Map(epic, _service));
        }

        [Authorize(Policy = "projects.write")]
        [HttpPut("{seq}")]
        public async Task<IActionResult> Update(int seq, [FromBody] Epic entity, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var existing = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq);

            if (existing is null)
                return NotFound();

            if (existing.Id != entity.Id)
                return BadRequest();

            await _service.UpdateAsync(entity);
            return NoContent();
        }

        [Authorize(Policy = "projects.write")]
        [HttpDelete("{seq}")]
        public async Task<IActionResult> Delete(int seq, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var epic = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq);

            if (epic is null)
                return NotFound();

            var deleted = await _service.DeleteByIdAsync(epic.Id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<EpicDTO>> CreateFromDto([FromBody] CreateEpicRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var promise = await _context.Promises
                .FirstOrDefaultAsync(p => p.ProjectId == projectEntity.Id && p.Id == request.ProductPromiseId);

            if (promise is null)
                return NotFound("Promise not found.");

            var nextSeq = await _context.GetNextEpicSequenceAsync(promise.Id);

            var epic = new Epic
            {
                Statement = request.Statement,
                Description = request.Description,
                ProductPromiseId = promise.Id,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _service.AddAsync(epic);
            return CreatedAtAction(nameof(GetBySeq), new { owner, project, seq = epic.SequenceNumber }, _mapper.Map(epic, _service));
        }

        [Authorize(Policy = "projects.write")]
        [HttpPatch("{seq}/description")]
        public async Task<ActionResult<EpicDTO>> UpdateDescription(int seq, [FromBody] UpdateDescriptionRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var epic = await _context.Epics
                .FirstOrDefaultAsync(e => e.ProductPromise.ProjectId == projectEntity.Id && e.SequenceNumber == seq);

            if (epic is null)
                return NotFound();

            epic.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            epic.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(epic);
            return Ok(_mapper.Map(epic, _service));
        }
    }
}
