using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/epics/{epicId}/[controller]")]
public class JourneysController : ControllerBase
{
    private readonly IJourneyService _service;
    private readonly ILogger<JourneysController> _logger;

    public JourneysController(IJourneyService service, ILogger<JourneysController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetJourneyById(int id)
    {
        try
        {
            var journey = await _service.GetJourneyByIdAsync(id);
            if (journey == null)
                return NotFound();
            return Ok(journey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting journey {JourneyId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetJourneysByEpic(int epicId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _service.GetJourneysByEpicAsync(epicId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting journeys for epic {EpicId}", epicId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateJourney(int epicId, [FromBody] CreateJourneyRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
                return BadRequest(new { message = "Journey statement is required" });

            var journey = await _service.CreateJourneyAsync(epicId, request);
            return CreatedAtAction(nameof(GetJourneyById), new { epicId, id = journey.Id }, journey);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating journey in epic {EpicId}", epicId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateJourney(int id, [FromBody] UpdateJourneyRequest request)
    {
        try
        {
            var journey = await _service.UpdateJourneyAsync(id, request);
            return Ok(journey);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating journey {JourneyId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteJourney(int id)
    {
        try
        {
            var success = await _service.DeleteJourneyAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting journey {JourneyId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
