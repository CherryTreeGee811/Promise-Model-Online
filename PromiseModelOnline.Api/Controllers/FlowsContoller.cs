using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    /// <summary>REST controller for flow CRUD with journey-scoped queries and description updates.</summary>
    /// <remarks>
    ///   Route is disabled via <c>__disabled__</c> prefix; use <c>ProjectFlowsController</c> instead.
    ///   Provides an override for <c>GetAll</c> that supports filtering by <c>journeyId</c> query parameter.
    /// </remarks>
    [Route("__disabled__/{controller}")]
    public class FlowsController : GenericController<Flow, FlowDTO>
    {
        private readonly IFlowService _flowService;
        private readonly IPromiseModelOnlineContext _context;

        /// <summary>Initializes the controller with required services.</summary>
        public FlowsController(
            IFlowService service,
            IGenericMapper<Flow, FlowDTO> mapper,
            IPromiseModelOnlineContext context)
            : base(service, mapper)
        {
            _flowService = service;
            _context = context;
        }

        /// <summary>Create a flow from a DTO with auto-generated sequence number.</summary>
        /// <param name="request">The flow creation data.</param>
        /// <response code="201">Returns the created flow with a Location header.</response>
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

        /// <summary>Retrieve all flows, optionally filtered by journey ID.</summary>
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

        /// <summary>Update a flow's description.</summary>
        [Authorize(Policy = "projects.write")]
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
