using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using System.Threading.Tasks;
using System.Security.Claims;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>
    /// Represents a run/batch that generates deadline notifications.
    /// </summary>
    [Authorize]
    [Route("api/deadline-notification-runs")]
    [ApiController]
    public class DeadlineNotificationRunsController : ControllerBase
    {
        private readonly IStrideService _strideService;

        public DeadlineNotificationRunsController(IStrideService strideService)
        {
            _strideService = strideService;
        }

        // ✅ WRITE scope (important)
        [Authorize]
        [Authorize(Policy = "Projects.Write")]
        [HttpPost]
        public async Task<IActionResult> Create()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(email))
                return Unauthorized();

            await _strideService.SendDeadlineNotificationsAsync();
            return NoContent();
        }
    }
}