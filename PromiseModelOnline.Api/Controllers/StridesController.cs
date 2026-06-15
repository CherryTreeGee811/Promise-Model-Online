using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>REST controller for stride CRUD with unfinished moment progression.</summary>
    /// <remarks>Route disabled — use <c>ProjectStridesController</c> instead.</remarks>
    [Route("__disabled__/{controller}")]
    public class StridesController : GenericController<Stride, StrideDTO>
    {
        private readonly IStrideService _strideService;
        private readonly IMomentService _momentService;
        private readonly ILogger<StridesController> _logger;

        public StridesController(
            IStrideService strideService,
            IGenericMapper<Stride, StrideDTO> mapper,
            IMomentService momentService,
            ILogger<StridesController> logger)
            : base(strideService, mapper)
        {
            _strideService = strideService;
            _momentService = momentService;
            _logger = logger;
        }

        /// <summary>Return all strides, optionally filtered by iteration ID.</summary>
        /// <returns>A list of stride DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public override async Task<ActionResult<IEnumerable<StrideDTO>>> GetAll()
        {
            IEnumerable<Stride> strides;

            var iterationIdStr = Request.Query["iterationId"];
            if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
                strides = await _strideService.GetStridesByIterationAsync(iterationId);
            else
                strides = await _strideService.GetAllAsync();

            var result = new List<StrideDTO>();
            foreach (var stride in strides)
                result.Add(_mapper.Map(stride, _service));

            return Ok(result);
        }
        /// <param name="id">The stride ID.</param>
        /// <param name="request">The stride update request.</param>

        /// <summary>Complete a stride and progress unfinished moments.</summary>
        /// <param name="id">The stride ID.</param>
        /// <param name="request">The stride update request.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateStride(int id, [FromBody] UpdateStrideRequestDTO request)
        {
            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);
                _logger.LogInformation("Progressed unfinished moments for stride {StrideId}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update stride {StrideId}", id);
                return BadRequest(ex.Message);
            }
        }
        /// <param name="id">The stride ID.</param>

        /// <summary>Manually trigger progression of unfinished moments from a stride.</summary>
        /// <param name="id">The stride ID.</param>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPost("{id}/progress")]
        public async Task<ActionResult> ProgressStride(int id)
        {
            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);
                return NoContent();
            }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }
    }
}
