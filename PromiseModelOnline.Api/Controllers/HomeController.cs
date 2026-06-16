using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>Health check endpoint for load balancer and container orchestration probes.</summary>
[ApiController]
[Route("api/[controller]")]
public class HomeController : ControllerBase
{
    private readonly ILogger<HomeController> _logger;

    /// <summary>Initializes the controller with the logger.</summary>
    /// <param name="logger">The logger for audit and error events.</param>
    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

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
