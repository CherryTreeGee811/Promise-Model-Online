using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;
    /// <summary>Unit tests for <see cref="NotificationsController"/> covering notification read state.</summary>
// Requirements: REQ_FUN_035
    public class NotificationControllerUnitTests
    {
        private Mock<INotificationService> _notificationServiceMock = null!;
        private Mock<IUserRepository> _userRepositoryMock = null!;
        private NotificationsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _notificationServiceMock = new Mock<INotificationService>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _controller = new NotificationsController(
                _notificationServiceMock.Object,
                _userRepositoryMock.Object,
                NullLogger<NotificationsController>.Instance);
        }

        [Test]
        public async Task REQ_FUN_035_GetNotifications_WithAuthenticatedUser_ReturnsOkWithNotifications()
        {
            // Arrange
            var notifications = new List<NotificationDto>
            {
                new NotificationDto { Id = 1, Message = "Welcome", Type = "Info", IsRead = false },
                new NotificationDto { Id = 2, Message = "Project updated", Type = "Update", IsRead = false }
            };
            var currentUser = new User { Id = 17, Email = "user@example.com", Name = "User" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", "user-name"))
                .ReturnsAsync(currentUser);
            _notificationServiceMock
                .Setup(s => s.GetUnreadNotificationsAsync(currentUser.Id))
                .ReturnsAsync(notifications);

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com", "user-name");

            // Act
            var result = await _controller.GetNotifications();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(notifications));
            _notificationServiceMock.Verify(s => s.GetUnreadNotificationsAsync(currentUser.Id), Times.Once);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", "user-name"), Times.Once);
        }

        [Test]
        public async Task REQ_FUN_035_GetNotifications_MissingEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.GetNotifications();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _notificationServiceMock.Verify(s => s.GetUnreadNotificationsAsync(It.IsAny<int>()), Times.Never);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }

        [Test]
        public async Task REQ_FUN_035_UpdateNotification_SetRead_WithAuthenticatedUser_ReturnsNoContent()
        {
            // Arrange
            var currentUser = new User { Id = 21, Email = "reader@example.com", Name = "Reader" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("reader@example.com", null))
                .ReturnsAsync(currentUser);
            _notificationServiceMock
                .Setup(s => s.MarkAsReadAsync(9, currentUser.Id))
                .Returns(Task.CompletedTask);

            ControllerTestHelpers.SetControllerUser(_controller, "reader@example.com");

            // Act
            var result = await _controller.UpdateNotification(9, new UpdateNotificationRequestDto { IsRead = true });

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _notificationServiceMock.Verify(s => s.MarkAsReadAsync(9, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task REQ_FUN_035_UpdateNotification_MissingEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.UpdateNotification(9, new UpdateNotificationRequestDto { IsRead = true });

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _notificationServiceMock.Verify(s => s.MarkAsReadAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task REQ_FUN_035_UpdateNotifications_SetAllRead_WithAuthenticatedUser_ReturnsNoContent()
        {
            // Arrange
            var currentUser = new User { Id = 33, Email = "reader@example.com", Name = "Reader" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("reader@example.com", "reader-name"))
                .ReturnsAsync(currentUser);
            _notificationServiceMock
                .Setup(s => s.MarkAllAsReadAsync(currentUser.Id))
                .Returns(Task.CompletedTask);

            ControllerTestHelpers.SetControllerUser(_controller, "reader@example.com", "reader-name");

            // Act
            var result = await _controller.UpdateNotifications(new UpdateNotificationsRequestDto { IsRead = true, ApplyToAll = true });

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _notificationServiceMock.Verify(s => s.MarkAllAsReadAsync(currentUser.Id), Times.Once);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("reader@example.com", "reader-name"), Times.Once);
        }

        [Test]
        public async Task REQ_FUN_035_UpdateNotifications_ByIds_WithAuthenticatedUser_ReturnsNoContent()
        {
            // Arrange
            var currentUser = new User { Id = 33, Email = "reader@example.com", Name = "Reader" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("reader@example.com", "reader-name"))
                .ReturnsAsync(currentUser);

            _notificationServiceMock
                .Setup(s => s.MarkAsReadAsync(It.IsAny<int>(), currentUser.Id))
                .Returns(Task.CompletedTask);

            ControllerTestHelpers.SetControllerUser(_controller, "reader@example.com", "reader-name");

            // Act
            var result = await _controller.UpdateNotifications(new UpdateNotificationsRequestDto
            {
                IsRead = true,
                NotificationIds = new[] { 1, 2, 2 }
            });

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _notificationServiceMock.Verify(s => s.MarkAsReadAsync(1, currentUser.Id), Times.Once);
            _notificationServiceMock.Verify(s => s.MarkAsReadAsync(2, currentUser.Id), Times.Once);
            _notificationServiceMock.Verify(s => s.MarkAllAsReadAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task REQ_FUN_035_UpdateNotifications_MissingEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.UpdateNotifications(new UpdateNotificationsRequestDto { IsRead = true, ApplyToAll = true });

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _notificationServiceMock.Verify(s => s.MarkAllAsReadAsync(It.IsAny<int>()), Times.Never);
        }
    }
