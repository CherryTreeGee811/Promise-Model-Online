using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
<<<<<<< HEAD
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    [Route("__disabled__/{controller}")]
    public class FlowsController : GenericController<Flow, FlowDTO>
    {
        private readonly IFlowService _flowService;
        private readonly IPromiseModelOnlineContext _context;

        public FlowsController(
            IFlowService service,
            IGenericMapper<Flow, FlowDTO> mapper,
            IPromiseModelOnlineContext context)
            : base(service, mapper)
        {
            _flowService = service;
            _context = context;
        }

        [Authorize(Policy = "projects.write")]
        [HttpPost("create")]
        public async Task<ActionResult<FlowDTO>> CreateFromDto([FromBody] CreateFlowRequestDTO request)
        {
            if (request is null) return BadRequest("Request is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var nextSeq = await _context.GetNextFlowSequenceAsync(request.JourneyId);

            var flow = new Flow
            {
                Statement = request.Statement,
                Description = request.Description,
                JourneyId = request.JourneyId,
                SequenceNumber = nextSeq,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _flowService.AddAsync(flow);
            return CreatedAtAction(nameof(GetById), new { id = flow.Id }, _mapper.Map(flow, _service));
        }

        [Authorize(Policy = "projects.read")]
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

        [Authorize(Policy = "projects.write")]
||||||| 1bedf4f
=======
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using System;
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

        [HttpPost("create")]
        public async Task<ActionResult<FlowDTO>> CreateFromDto([FromBody] CreateFlowRequestDTO request)
        {
            if (request is null) return BadRequest("Request is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var flow = new Flow
            {
                Statement = request.Statement,
                Description = request.Description,
                JourneyId = request.JourneyId,
                DisplayOrder = request.DisplayOrder,
                StatusColor = "red"
            };

            await _flowService.AddAsync(flow);
            return CreatedAtAction(nameof(GetById), new { id = flow.Id }, _mapper.Map(flow, _service));
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

>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
        [HttpPatch("{id}/description")]
        public async Task<ActionResult<FlowDTO>> UpdateDescription(
            int id,
            [FromBody] UpdateDescriptionRequestDTO request)
        {
            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var flow = await _service.GetByIdAsync(id);
            if (flow is null)
                return NotFound();

            flow.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();
            flow.UpdatedAt = DateTime.UtcNow;

            await _service.UpdateAsync(flow);
            return Ok(_mapper.Map(flow, _service));
        }
    }
}