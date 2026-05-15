using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class StridesController : GenericController<Stride, StrideDTO>
    {
        private readonly IStrideService _strideService;
        private readonly IMomentService _momentService;

        public StridesController(
            IStrideService strideService,
            IGenericMapper<Stride, StrideDTO> mapper,
            IMomentService momentService)
            : base(strideService, mapper)
        {
            _strideService = strideService;
            _momentService = momentService;
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
        /// Move unfinished moments from this stride to the next stride.
        /// </summary>
        [HttpPost("{id}/progress")]
        public async Task<IActionResult> ProgressStride(int id)
        {
            await _momentService.MoveUnfinishedMomentsToNextStrideAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Send deadline notifications for all strides ending in 3 days.
        /// </summary>
        [HttpPost("send-deadline-notifications")]
        public async Task<IActionResult> SendDeadlineNotifications()
        {
            await _strideService.SendDeadlineNotificationsAsync();
            return NoContent();
        }
    }
}