using Microsoft.AspNetCore.Mvc;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>Health check endpoint for verifying application availability.</summary>
    [ApiController]
    public class HomeController : ControllerBase
    {
        /// <summary>Verify that the application is running and can respond.</summary>
        /// <response code="200">Returns <c>{ "status": "healthy" }</c>.</response>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy" });
        }
    }
}
