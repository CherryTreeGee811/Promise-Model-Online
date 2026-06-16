using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    /// <summary>Triggers generation of deadline notifications for ending strides.</summary>
    /// <remarks>
    ///   Creating a run invokes <see cref="IStrideService.SendDeadlineNotificationsAsync"/> which
    ///   finds all strides ending soon and sends notifications to project members.
    ///   Requires the <c>projects.write</c> authorization policy.
    /// </remarks>
    [Authorize(Policy = "projects.write")]
    [Route("api/deadline-notification-runs")]
    [ApiController]
    public class DeadlineNotificationRunsController : ControllerBase
    {
        private readonly IStrideService _strideService;
        private readonly ILogger<DeadlineNotificationRunsController> _logger;

        /// <summary>Initializes the controller with the stride service.</summary>
        /// <param name="strideService">The stride service.</param>
        /// <param name="logger">The logger for audit and error events.</param>
        public DeadlineNotificationRunsController(IStrideService strideService, ILogger<DeadlineNotificationRunsController> logger)
        {
            _strideService = strideService;
            _logger = logger;
        }

        /// <summary>Trigger deadline notification generation for strides ending in 3 days.</summary>
        /// <response code="204">Notifications were generated successfully.</response>
        /// <returns>NoContent on successful notification generation.</returns>
        [HttpPost]
        public async Task<IActionResult> Create()
        {
            await _strideService.SendDeadlineNotificationsAsync();
            return NoContent();
        }
    }
}
