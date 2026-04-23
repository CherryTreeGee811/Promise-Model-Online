using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/flows/{flowId}/[controller]")]
public class MomentsController : ControllerBase
{
    private readonly IMomentService _service;
    private readonly ILogger<MomentsController> _logger;

    public MomentsController(IMomentService service, ILogger<MomentsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMomentById(int id)
    {
        try
        {
            var moment = await _service.GetMomentByIdAsync(id);
            if (moment == null)
                return NotFound();
            return Ok(moment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting moment {MomentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMomentsByFlow(int flowId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _service.GetMomentsByFlowAsync(flowId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting moments for flow {FlowId}", flowId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateMoment(int flowId, [FromBody] CreateMomentRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
                return BadRequest(new { message = "Moment statement is required" });

            var moment = await _service.CreateMomentAsync(flowId, request);
            return CreatedAtAction(nameof(GetMomentById), new { flowId, id = moment.Id }, moment);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating moment in flow {FlowId}", flowId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMoment(int id, [FromBody] UpdateMomentRequest request)
    {
        try
        {
            var moment = await _service.UpdateMomentAsync(id, request);
            return Ok(moment);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating moment {MomentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMoment(int id)
    {
        try
        {
            var success = await _service.DeleteMomentAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting moment {MomentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteMoment(int id)
    {
        try
        {
            var success = await _service.CompleteMomentAsync(id);
            if (!success)
                return NotFound();
            
            var moment = await _service.GetMomentByIdAsync(id);
            return Ok(moment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing moment {MomentId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
