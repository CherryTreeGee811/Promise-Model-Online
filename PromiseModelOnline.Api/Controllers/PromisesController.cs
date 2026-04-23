using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.Contracts.Requests;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/[controller]")]
public class PromisesController : ControllerBase
{
    private readonly IPromiseService _service;
    private readonly ILogger<PromisesController> _logger;

    public PromisesController(IPromiseService service, ILogger<PromisesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPromiseById(int id)
    {
        try
        {
            var promise = await _service.GetPromiseByIdAsync(id);
            if (promise == null)
                return NotFound();
            return Ok(promise);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting promise {PromiseId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetPromisesByProject(int projectId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var result = await _service.GetPromisesByProjectAsync(projectId, pageNumber, pageSize);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting promises for project {ProjectId}", projectId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreatePromise(int projectId, [FromBody] CreatePromiseRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Statement))
                return BadRequest(new { message = "Promise statement is required" });

            var promise = await _service.CreatePromiseAsync(projectId, request);
            return CreatedAtAction(nameof(GetPromiseById), new { projectId, id = promise.Id }, promise);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating promise in project {ProjectId}", projectId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePromise(int id, [FromBody] UpdatePromiseRequest request)
    {
        try
        {
            var promise = await _service.UpdatePromiseAsync(id, request);
            return Ok(promise);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating promise {PromiseId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePromise(int id)
    {
        try
        {
            var success = await _service.DeletePromiseAsync(id);
            if (!success)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting promise {PromiseId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
