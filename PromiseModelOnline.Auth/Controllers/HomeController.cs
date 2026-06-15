using Microsoft.AspNetCore.Mvc;

namespace PromiseModelOnline.Auth.Controllers
{
    /// <summary>Health-check endpoint used by load balancers and orchestrators.</summary>
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
