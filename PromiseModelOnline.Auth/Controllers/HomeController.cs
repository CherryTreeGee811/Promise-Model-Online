using Microsoft.AspNetCore.Mvc;

namespace PromiseModelOnline.Auth.Controllers
{
    [ApiController]
    public class HomeController : ControllerBase
    {
        /// <summary>
        /// Used to verify that the application is running and can respond.
        /// </summary>
        /// <returns>Returns the status healthy.</returns>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy" });
        }
    }
}