using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/journeys/{journeyId}/[controller]")]
public class FlowsController : ControllerBase
{
    private readonly IFlowService _service;
    private readonly ILogger<FlowsController> _logger;

    public FlowsController(IFlowService service, ILogger<FlowsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFlowById(int id)
    {
        try
        {
            var flow = await _service.GetFlowByIdAsync(id);
            if (flow == null)
                return NotFound();
            return Ok(flow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flow {FlowId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetFlowsByJourney(int journeyId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _service.GetFlowsByJourneyAsync(journeyId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flows for journey {JourneyId}", journeyId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateFlow(int journeyId, [FromBody] CreateFlowRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
                return BadRequest(new { message = "Flow statement is required" });

            var flow = await _service.CreateFlowAsync(journeyId, request);
            return CreatedAtAction(nameof(GetFlowById), new { journeyId, id = flow.Id }, flow);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating flow in journey {JourneyId}", journeyId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFlow(int id, [FromBody] UpdateFlowRequest request)
    {
        try
        {
            var flow = await _service.UpdateFlowAsync(id, request);
            return Ok(flow);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating flow {FlowId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFlow(int id)
    {
        try
        {
            var success = await _service.DeleteFlowAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting flow {FlowId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
