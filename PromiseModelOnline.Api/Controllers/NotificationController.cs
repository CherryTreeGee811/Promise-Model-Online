using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(INotificationService notificationService,
                                       IUserRepository userRepository,
                                       ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService;
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetNotifications()
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            var notifications = await _notificationService.GetUnreadNotificationsAsync(userId.Value);
            return Ok(notifications);
        }

        /// <summary>
        /// Partially updates a notification (currently supports setting read state).
        /// </summary>
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateNotification(int id, [FromBody] UpdateNotificationRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                await _notificationService.MarkAsReadAsync(id, userId.Value);
            }
            catch (InvalidOperationException)
            {
                return NotFound();
            }

            _logger.LogInformation(
                "User {UserId} updated Notification {NotificationId} at {UtcTimestamp}: {Changes}",
                userId.Value,
                id,
                DateTime.UtcNow,
                new { IsRead = true });

            return NoContent();
        }

        /// <summary>
        /// Partially updates the current user's notifications (currently supports setting all to read).
        /// </summary>
        [HttpPatch]
        public async Task<IActionResult> UpdateNotifications([FromBody] UpdateNotificationsRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            if (request is null)
                return BadRequest("Request body is required.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            if (request.ApplyToAll == true && request.NotificationIds is not null)
                return BadRequest("Cannot specify both ApplyToAll and NotificationIds");

            var applyToAll = request.ApplyToAll == true;
            var ids = request.NotificationIds?.Distinct().ToArray();

            if (!applyToAll && (ids is null || ids.Length == 0))
                return BadRequest("Must provide NotificationIds if not applying to all");

            if (applyToAll)
            {
                await _notificationService.MarkAllAsReadAsync(userId.Value);

                _logger.LogInformation(
                    "User {UserId} updated Notifications at {UtcTimestamp}: {Details}",
                    userId.Value,
                    DateTime.UtcNow,
                    new { ApplyToAll = true, Changes = new { IsRead = true } });

                return NoContent();
            }

            foreach (var id in ids!)
            {
                try
                {
                    await _notificationService.MarkAsReadAsync(id, userId.Value);
                }
                catch (InvalidOperationException)
                {
                    return NotFound($"Notification {id} not found.");
                }
            }

            _logger.LogInformation(
                "User {UserId} updated Notifications at {UtcTimestamp}: {Details}",
                userId.Value,
                DateTime.UtcNow,
                new { ApplyToAll = false, NotificationIds = ids, Changes = new { IsRead = true } });

            return NoContent();
        }

        private async Task<int?> GetCurrentUserIdByEmailAsync()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email)) return null;

            var username = User.FindFirst("nameid")?.Value;
            var user = await _userRepository.GetOrCreateUserByEmailAsync(email, username);
            return user.Id;
        }
    }
}