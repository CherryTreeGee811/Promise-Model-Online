using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>Health check endpoint for load balancer and container orchestration probes.</summary>
/// <remarks>Initializes the controller with the logger.</remarks>
/// <param name="logger">The logger for audit and error events.</param>
[ApiController]
[Route("")]
public class HomeController(ILogger<HomeController> logger) : ControllerBase
{
    private readonly ILogger<HomeController> _logger = logger;

    /// <summary>Verify that the application is running and can respond.</summary>
    /// <response code="200">Returns <c>{ "status": "healthy" }</c>.</response>
    [HttpGet("health")]
    [ProducesResponseType<object>(StatusCodes.Status200OK)]
    public IActionResult HealthCheck()
    {
        _logger.LogDebug("Health check called");
        return Ok(new { status = "healthy" });
    }
}
