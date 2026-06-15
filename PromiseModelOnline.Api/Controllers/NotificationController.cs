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
    /// <summary>REST controller for notification read-state management.</summary>
    /// <remarks>
    ///   Supports retrieving unread notifications, marking individual or all notifications as read.
    ///   Requires <c>projects.read</c> for reads and <c>projects.write</c> for mutations.
    /// </remarks>
    [Route("api/notifications")]
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

        /// <summary>Return unread notifications for the current user.</summary>
        /// <returns>A list of notification DTOs.</returns>
        [Authorize(Policy = "projects.read")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetNotifications()
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            var notifications = await _notificationService.GetUnreadNotificationsAsync(userId.Value);
            return Ok(notifications);
        }
        /// <param name="id">The notification ID.</param>
        /// <param name="request">The update request data.</param>

        /// <summary>Mark a single notification as read.</summary>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateNotification(int id, [FromBody] UpdateNotificationRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try { await _notificationService.MarkAsReadAsync(id, userId.Value); }
            catch (InvalidOperationException) { return NotFound(); }

            _logger.LogInformation("User {UserId} read notification {NotificationId}", userId.Value, id);
            return NoContent();
        }
        /// <param name="request">The bulk update request data.</param>

        /// <summary>Mark notifications as read, either all or specific IDs.</summary>
        /// <returns>NoContent on success.</returns>
        [Authorize(Policy = "projects.write")]
        [HttpPatch]
        public async Task<IActionResult> UpdateNotifications([FromBody] UpdateNotificationsRequestDTO request)
        {
            var userId = await GetCurrentUserIdByEmailAsync();
            if (userId is null) return Unauthorized();

            if (request is null) return BadRequest("Request body is required.");
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            if (request.ApplyToAll == true && request.NotificationIds is not null)
                return BadRequest("Cannot specify both ApplyToAll and NotificationIds");

            var applyToAll = request.ApplyToAll == true;
            var ids = request.NotificationIds?.Distinct().ToArray();

            if (!applyToAll && (ids is null || ids.Length == 0))
                return BadRequest("Must provide NotificationIds if not applying to all");

            if (applyToAll)
            {
                await _notificationService.MarkAllAsReadAsync(userId.Value);
                _logger.LogInformation("User {UserId} marked all notifications as read", userId.Value);
                return NoContent();
            }

            foreach (var id in ids!)
            {
                try { await _notificationService.MarkAsReadAsync(id, userId.Value); }
                catch (InvalidOperationException) { return NotFound($"Notification {id} not found."); }
            }

            _logger.LogInformation("User {UserId} marked {Count} notifications as read", userId.Value, ids.Length);
            return NoContent();
        }

        /// <summary>Resolve the current user ID from JWT email claim.</summary>
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
