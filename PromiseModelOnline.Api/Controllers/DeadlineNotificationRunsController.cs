using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>
    /// Represents a run/batch that generates deadline notifications.
    /// Creating a run triggers generation of deadline notifications.
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

        [HttpPost]
        public async Task<IActionResult> Create()
        {
            await _strideService.SendDeadlineNotificationsAsync();
            return NoContent();
        }
    }
}
