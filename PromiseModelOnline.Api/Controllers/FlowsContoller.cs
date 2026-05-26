using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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