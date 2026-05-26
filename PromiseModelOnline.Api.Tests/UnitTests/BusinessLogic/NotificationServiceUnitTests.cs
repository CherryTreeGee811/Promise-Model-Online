using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class NotificationServiceUnitTests
    {
        private Mock<INotificationRepository> _notificationRepoMock = null!;
        private Mock<IGenericMapper<Notification, NotificationDTO>> _mapperMock = null!;
        private NotificationService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _notificationRepoMock = new Mock<INotificationRepository>();
            _mapperMock = new Mock<IGenericMapper<Notification, NotificationDTO>>();
            _service = new NotificationService(_notificationRepoMock.Object, _mapperMock.Object);
        }

        #region GetUnreadNotificationsAsync

        [Test]
        public async Task GetUnreadNotificationsAsync_ReturnsMappedDtos()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = 1, Message = "N1" },
                new Notification { Id = 2, Message = "N2" }
            };

            _notificationRepoMock.Setup(r => r.GetUnreadByUserIdAsync(10)).ReturnsAsync(notifications);
            _mapperMock.Setup(m => m.Map(It.IsAny<Notification>(), null!))
                       .Returns<Notification, IGenericService<Notification>>((n, _) => new NotificationDTO
                       {
                           Id = n.Id,
                           Message = n.Message
                       });

            // Act
            var result = await _service.GetUnreadNotificationsAsync(10);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Message, Is.EqualTo("N1"));
            _notificationRepoMock.Verify(r => r.GetUnreadByUserIdAsync(10), Times.Once);
        }

        [Test]
        public async Task GetUnreadNotificationsAsync_NoUnread_ReturnsEmpty()
        {
            _notificationRepoMock.Setup(r => r.GetUnreadByUserIdAsync(5)).ReturnsAsync(new List<Notification>());

            var result = await _service.GetUnreadNotificationsAsync(5);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region GetAllNotificationsAsync

        [Test]
        public async Task GetAllNotificationsAsync_ReturnsMappedDtos()
        {
            var notifications = new List<Notification>
            {
                new Notification { Id = 1, Message = "All N1" }
            };
            _notificationRepoMock.Setup(r => r.GetAllByUserIdAsync(20)).ReturnsAsync(notifications);
            _mapperMock.Setup(m => m.Map(It.IsAny<Notification>(), null!))
                       .Returns<Notification, IGenericService<Notification>>((n, _) => new NotificationDTO
                       {
                           Id = n.Id,
                           Message = n.Message
                       });

            var result = await _service.GetAllNotificationsAsync(20);

            Assert.That(result.Count(), Is.EqualTo(1));
            Assert.That(result.First().Message, Is.EqualTo("All N1"));
        }

        [Test]
        public async Task GetAllNotificationsAsync_Empty_ReturnsEmpty()
        {
            _notificationRepoMock.Setup(r => r.GetAllByUserIdAsync(30)).ReturnsAsync(new List<Notification>());

            var result = await _service.GetAllNotificationsAsync(30);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region MarkAsReadAsync

        [Test]
        public async Task MarkAsReadAsync_Valid_MarksAsRead()
        {
            var notification = new Notification { Id = 1, UserId = 100 };
            _notificationRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(notification);
            _notificationRepoMock.Setup(r => r.MarkAsReadAsync(1)).Returns(Task.CompletedTask);

            await _service.MarkAsReadAsync(1, 100);

            _notificationRepoMock.Verify(r => r.MarkAsReadAsync(1), Times.Once);
        }

        [Test]
        public void MarkAsReadAsync_NotificationNotFound_Throws()
        {
            _notificationRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Notification?)null);

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.MarkAsReadAsync(99, 1));
        }

        [Test]
        public void MarkAsReadAsync_WrongUser_ThrowsAccessDenied()
        {
            var notification = new Notification { Id = 2, UserId = 200 };
            _notificationRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(notification);

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.MarkAsReadAsync(2, 999));
        }

        #endregion

        #region MarkAllAsReadAsync

        [Test]
        public async Task MarkAllAsReadAsync_DelegatesToRepository()
        {
            _notificationRepoMock.Setup(r => r.MarkAllAsReadAsync(50)).Returns(Task.CompletedTask);

            await _service.MarkAllAsReadAsync(50);

            _notificationRepoMock.Verify(r => r.MarkAllAsReadAsync(50), Times.Once);
        }

        #endregion

        #region CreateNotificationAsync

        [Test]
        public async Task CreateNotificationAsync_AddsAndSavesNotification()
        {
            // Arrange
            Notification? savedNotification = null;
            _notificationRepoMock.Setup(r => r.AddAsync(It.IsAny<Notification>()))
                                 .Callback<Notification>(n => savedNotification = n)
                                 .Returns(Task.CompletedTask);
            _notificationRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            // Act
            await _service.CreateNotificationAsync(77, NotificationType.Mention, "You were mentioned", "/moments/5");

            // Assert
            Assert.That(savedNotification, Is.Not.Null);
            Assert.That(savedNotification!.UserId, Is.EqualTo(77));
            Assert.That(savedNotification.Type, Is.EqualTo(NotificationType.Mention));
            Assert.That(savedNotification.Message, Is.EqualTo("You were mentioned"));
            Assert.That(savedNotification.Link, Is.EqualTo("/moments/5"));
            Assert.That(savedNotification.CreatedAt, Is.Not.EqualTo(default(DateTime)));
            _notificationRepoMock.Verify(r => r.AddAsync(It.IsAny<Notification>()), Times.Once);
            _notificationRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Test]
        public async Task CreateNotificationAsync_LinkIsNull_DoesNotSetLink()
        {
            Notification? savedNotification = null;
            _notificationRepoMock.Setup(r => r.AddAsync(It.IsAny<Notification>()))
                                 .Callback<Notification>(n => savedNotification = n)
                                 .Returns(Task.CompletedTask);
            _notificationRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            await _service.CreateNotificationAsync(1, NotificationType.Deadline, "Stride ending");

            Assert.That(savedNotification, Is.Not.Null);
            Assert.That(savedNotification!.Link, Is.Null);
        }

        #endregion
    }
}