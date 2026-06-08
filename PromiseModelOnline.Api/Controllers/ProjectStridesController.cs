using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
    [Route("api/projects/{owner}/{project}/strides")]
    public class ProjectStridesController : ProjectScopedControllerBase
    {
        private readonly IStrideService _strideService;
        private readonly IMomentService _momentService;
        private readonly IGenericMapper<Stride, StrideDTO> _mapper;
        private readonly IPromiseModelOnlineContext _context;
        private readonly ILogger<ProjectStridesController> _logger;

        public ProjectStridesController(
            IStrideService strideService,
            IMomentService momentService,
            IGenericMapper<Stride, StrideDTO> mapper,
            IPromiseModelOnlineContext context,
            IProjectService projectService,
            ILogger<ProjectStridesController> logger)
            : base(projectService)
        {
            _strideService = strideService;
            _momentService = momentService;
            _mapper = mapper;
            _context = context;
            _logger = logger;
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StrideDTO>>> GetAll(string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            IEnumerable<Stride> strides;

            var iterationIdStr = Request.Query["iterationId"];
            if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
            {
                var iteration = await _context.Iterations
                    .FirstOrDefaultAsync(i => i.ProjectId == projectEntity.Id && i.Id == iterationId);

                if (iteration is null)
                    return NotFound("Iteration not found.");

                strides = await _strideService.GetStridesByIterationAsync(iterationId);
            }
            else
            {
                strides = await _context.Strides
                    .Where(s => s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id)
                    .ToListAsync();
            }

            var result = new List<StrideDTO>();
            foreach (var stride in strides)
                result.Add(_mapper.Map(stride, _strideService));

            return Ok(result);
        }

        [Authorize(Policy = "projects.read")]
        [HttpGet("{id}")]
        public async Task<ActionResult<StrideDTO>> GetById(int id, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var stride = await _context.Strides
                .FirstOrDefaultAsync(s => s.Id == id && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);

            if (stride is null)
                return NotFound();

            return Ok(_mapper.Map(stride, _strideService));
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost]
        public async Task<ActionResult<StrideDTO>> Create([FromBody] Stride entity, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            if (entity.IterationId.HasValue)
            {
                var iteration = await _context.Iterations
                    .FirstOrDefaultAsync(i => i.ProjectId == projectEntity.Id && i.Id == entity.IterationId.Value);

                if (iteration is null)
                    return NotFound("Iteration not found.");
            }

            await _strideService.AddAsync(entity);
            return CreatedAtAction(nameof(GetById), new { owner, project, id = entity.Id }, _mapper.Map(entity, _strideService));
        }

        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateStride(int id, [FromBody] UpdateStrideRequestDTO request, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var stride = await _context.Strides
                .FirstOrDefaultAsync(s => s.Id == id && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);

            if (stride is null)
                return NotFound();

            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);

                _logger.LogInformation(
                    "Progressed unfinished moments for stride {StrideId} via PATCH",
                    id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update stride {StrideId}", id);
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost("{id}/progress")]
        public async Task<ActionResult> ProgressStride(int id, string owner, string project)
        {
            var projectEntity = await ResolveProjectAsync(owner, project);
            if (projectEntity is null)
                return NotFound();

            var stride = await _context.Strides
                .FirstOrDefaultAsync(s => s.Id == id && s.Iteration != null && s.Iteration.ProjectId == projectEntity.Id);

            if (stride is null)
                return NotFound();

            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
