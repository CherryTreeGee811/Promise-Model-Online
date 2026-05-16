using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
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

        /// <summary>
        /// Partially updates a stride.
        /// </summary>
        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateStride(int id, [FromBody] UpdateStrideRequestDTO request)
        {
            try
            {
                await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);

                _logger.LogInformation(
                    "Progressed unfinished moments for stride {StrideId} via PATCH",
                    id
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to update stride {StrideId}",
                    id
                );

                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Moves unfinished moments from this stride to the next stride.
        /// </summary>
        [HttpPost("{id}/progress")]
        public async Task<ActionResult> ProgressStride(int id)
        {
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