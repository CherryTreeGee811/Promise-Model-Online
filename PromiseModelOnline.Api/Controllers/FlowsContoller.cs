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
    public class FlowsController : GenericController<Flow, FlowDTO>
    {
        private readonly IFlowService _flowService;

        public FlowsController(
            IFlowService service,
            IGenericMapper<Flow, FlowDTO> mapper)
            : base(service, mapper)
        {
            _flowService = service;
        }

        [HttpGet]
        public override async Task<ActionResult<IEnumerable<FlowDTO>>> GetAll()
        {
            IEnumerable<Flow> flows;

            var journeyIdStr = Request.Query["journeyId"];
            if (!string.IsNullOrEmpty(journeyIdStr) && int.TryParse(journeyIdStr, out int journeyId))
                flows = await _flowService.GetFlowsByJourneyAsync(journeyId);
            else
                flows = await _flowService.GetAllAsync();

            var result = new List<FlowDTO>();
            foreach (var flow in flows)
                result.Add(_mapper.Map(flow, _service));

            return Ok(result);
        }
    }
}