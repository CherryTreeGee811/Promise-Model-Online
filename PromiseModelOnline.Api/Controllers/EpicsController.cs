using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/promises/{promiseId}/[controller]")]
public class EpicsController : ControllerBase
{
    private readonly IEpicService _service;
    private readonly ILogger<EpicsController> _logger;

    public EpicsController(IEpicService service, ILogger<EpicsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEpicById(int id)
    {
        try
        {
            var epic = await _service.GetEpicByIdAsync(id);
            if (epic == null)
                return NotFound();
            return Ok(epic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting epic {EpicId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetEpicsByPromise(int promiseId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _service.GetEpicsByPromiseAsync(promiseId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting epics for promise {PromiseId}", promiseId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateEpic(int promiseId, [FromBody] CreateEpicRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
                return BadRequest(new { message = "Epic statement is required" });

            var epic = await _service.CreateEpicAsync(promiseId, request);
            return CreatedAtAction(nameof(GetEpicById), new { promiseId, id = epic.Id }, epic);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating epic in promise {PromiseId}", promiseId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEpic(int id, [FromBody] UpdateEpicRequest request)
    {
        try
        {
            var epic = await _service.UpdateEpicAsync(id, request);
            return Ok(epic);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating epic {EpicId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEpic(int id)
    {
        try
        {
            var success = await _service.DeleteEpicAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting epic {EpicId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
