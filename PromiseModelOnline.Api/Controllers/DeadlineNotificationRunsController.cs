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
<<<<<<< HEAD
    [Authorize(Policy = "projects.write")]
||||||| 1bedf4f
=======
    [Authorize]
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
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
