using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
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
            _controller = new NotificationsController(_notificationServiceMock.Object, _userRepositoryMock.Object);
        }

        private void SetCurrentUser(string? email, string? nameId = null)
        {
            var claims = new List<Claim>();
            if (email is not null)
            {
                claims.Add(new Claim(ClaimTypes.Email, email));
            }

            if (nameId is not null)
            {
                claims.Add(new Claim("nameid", nameId));
            }

            var identity = new ClaimsIdentity(claims, "test");
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        [Test]
        public async Task GetNotifications_WithAuthenticatedUser_ReturnsOkWithNotifications()
        {
            var notifications = new List<NotificationDTO>
            {
                new NotificationDTO { Id = 1, Message = "Welcome", Type = "Info", IsRead = false },
                new NotificationDTO { Id = 2, Message = "Project updated", Type = "Update", IsRead = false }
            };
            var currentUser = new User { Id = 17, Email = "user@example.com", Name = "User" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", "user-name"))
                .ReturnsAsync(currentUser);
            _notificationServiceMock
                .Setup(s => s.GetUnreadNotificationsAsync(currentUser.Id))
                .ReturnsAsync(notifications);

            SetCurrentUser("user@example.com", "user-name");

            var result = await _controller.GetNotifications();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(notifications));
            _notificationServiceMock.Verify(s => s.GetUnreadNotificationsAsync(currentUser.Id), Times.Once);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", "user-name"), Times.Once);
        }

        [Test]
        public async Task GetNotifications_MissingEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.GetNotifications();

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _notificationServiceMock.Verify(s => s.GetUnreadNotificationsAsync(It.IsAny<int>()), Times.Never);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }

        [Test]
        public async Task MarkAsRead_WithAuthenticatedUser_ReturnsNoContent()
        {
            var currentUser = new User { Id = 21, Email = "reader@example.com", Name = "Reader" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("reader@example.com", null))
                .ReturnsAsync(currentUser);
            _notificationServiceMock
                .Setup(s => s.MarkAsReadAsync(9, currentUser.Id))
                .Returns(Task.CompletedTask);

            SetCurrentUser("reader@example.com");

            var result = await _controller.MarkAsRead(9);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _notificationServiceMock.Verify(s => s.MarkAsReadAsync(9, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task MarkAsRead_MissingEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.MarkAsRead(9);

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _notificationServiceMock.Verify(s => s.MarkAsReadAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task MarkAllAsRead_WithAuthenticatedUser_ReturnsNoContent()
        {
            var currentUser = new User { Id = 33, Email = "reader@example.com", Name = "Reader" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("reader@example.com", "reader-name"))
                .ReturnsAsync(currentUser);
            _notificationServiceMock
                .Setup(s => s.MarkAllAsReadAsync(currentUser.Id))
                .Returns(Task.CompletedTask);

            SetCurrentUser("reader@example.com", "reader-name");

            var result = await _controller.MarkAllAsRead();

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _notificationServiceMock.Verify(s => s.MarkAllAsReadAsync(currentUser.Id), Times.Once);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("reader@example.com", "reader-name"), Times.Once);
        }

        [Test]
        public async Task MarkAllAsRead_MissingEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.MarkAllAsRead();

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _notificationServiceMock.Verify(s => s.MarkAllAsReadAsync(It.IsAny<int>()), Times.Never);
        }
    }
}