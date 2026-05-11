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
    public class MomentsController : GenericController<Moment, MomentDTO>
    {
        private readonly IMomentService _momentService;

        public MomentsController(
            IMomentService service,
            IGenericMapper<Moment, MomentDTO> mapper)
            : base(service, mapper)
        {
            _momentService = service;
        }

        [HttpGet]
        public override async Task<ActionResult<IEnumerable<MomentDTO>>> GetAll()
        {
            IEnumerable<Moment> moments;

            var strideIdStr = Request.Query["strideId"];
            var flowIdStr = Request.Query["flowId"];
            var iterationIdStr = Request.Query["iterationId"];
            var unassignedStr = Request.Query["unassigned"];

            if (!string.IsNullOrEmpty(strideIdStr) && int.TryParse(strideIdStr, out int strideId))
            {
                moments = await _momentService.GetMomentsByStrideAsync(strideId);
            }
            else if (!string.IsNullOrEmpty(flowIdStr) && int.TryParse(flowIdStr, out int flowId))
            {
                moments = await _momentService.GetMomentsByFlowAsync(flowId);
            }
            else if (!string.IsNullOrEmpty(iterationIdStr) && int.TryParse(iterationIdStr, out int iterationId))
            {
                bool unassignedOnly = unassignedStr == "true";
                moments = await _momentService.GetMomentsByIterationAsync(iterationId, unassignedOnly);
            }
            else
            {
                moments = await _momentService.GetAllAsync();
            }

            var result = new List<MomentDTO>();
            foreach (var moment in moments)
                result.Add(_mapper.Map(moment, _service));

            return Ok(result);
        }
    }
}