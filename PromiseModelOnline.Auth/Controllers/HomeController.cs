using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace PromiseModelOnline.Auth.Controllers
{
    /// <summary>Health-check endpoint used by load balancers and orchestrators.</summary>
    [ApiController]
    [Route("health")]
    [AllowAnonymous]
    public class HomeController : ControllerBase
    {
        /// <summary>Verify that the application is running and can respond.</summary>
        /// <response code="200">Returns <c>{ "status": "healthy" }</c>.</response>
        [HttpGet]
        [ProducesResponseType<object>(StatusCodes.Status200OK)]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy" });
        }
    }
}
