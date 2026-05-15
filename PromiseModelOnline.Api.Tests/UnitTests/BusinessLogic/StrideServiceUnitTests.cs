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
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class StrideServiceUnitTests
    {
        private Mock<IStrideRepository> _strideRepoMock = null!;
        private Mock<IGenericRepository<Iteration>> _iterationRepoMock = null!;
        private Mock<IProjectService> _projectServiceMock = null!;
        private Mock<INotificationService> _notificationServiceMock = null!;
        private StrideService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _strideRepoMock = new Mock<IStrideRepository>();
            _iterationRepoMock = new Mock<IGenericRepository<Iteration>>();
            _projectServiceMock = new Mock<IProjectService>();
            _notificationServiceMock = new Mock<INotificationService>();

            _service = new StrideService(
                _strideRepoMock.Object,
                _iterationRepoMock.Object,
                _projectServiceMock.Object,
                _notificationServiceMock.Object);
        }

        #region GetStridesByIterationAsync

        [Test]
        public async Task GetStridesByIterationAsync_DelegatesToRepository()
        {
            var strides = new List<Stride>
            {
                new Stride { Id = 1, IterationId = 10 },
                new Stride { Id = 2, IterationId = 10 }
            };
            _strideRepoMock.Setup(r => r.GetStridesByIterationAsync(10)).ReturnsAsync(strides);

            var result = await _service.GetStridesByIterationAsync(10);

            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(s => s.IterationId == 10), Is.True);
            _strideRepoMock.Verify(r => r.GetStridesByIterationAsync(10), Times.Once);
        }

        [Test]
        public async Task GetStridesByIterationAsync_NoStrides_ReturnsEmpty()
        {
            _strideRepoMock.Setup(r => r.GetStridesByIterationAsync(99)).ReturnsAsync(new List<Stride>());

            var result = await _service.GetStridesByIterationAsync(99);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region SendDeadlineNotificationsAsync

        [Test]
        public async Task SendDeadlineNotificationsAsync_NoStridesEnding_DoesNothing()
        {
            _strideRepoMock.Setup(r => r.GetStridesEndingOnAsync(It.IsAny<DateTime>()))
                           .ReturnsAsync(new List<Stride>());

            await _service.SendDeadlineNotificationsAsync();

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never);
        }

        [Test]
        public async Task SendDeadlineNotificationsAsync_StrideWithoutIteration_Skips()
        {
            var stride = new Stride { Id = 1, Name = "NoIter", IterationId = null };
            _strideRepoMock.Setup(r => r.GetStridesEndingOnAsync(It.IsAny<DateTime>()))
                           .ReturnsAsync(new List<Stride> { stride });

            await _service.SendDeadlineNotificationsAsync();

            _iterationRepoMock.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never);
        }

        [Test]
        public async Task SendDeadlineNotificationsAsync_IterationNotFound_Skips()
        {
            var stride = new Stride { Id = 2, Name = "Stride2", IterationId = 50 };
            _strideRepoMock.Setup(r => r.GetStridesEndingOnAsync(It.IsAny<DateTime>()))
                           .ReturnsAsync(new List<Stride> { stride });
            _iterationRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync((Iteration?)null);

            await _service.SendDeadlineNotificationsAsync();

            _projectServiceMock.Verify(p => p.GetProjectMembersAsync(It.IsAny<int>()), Times.Never);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never);
        }

        [Test]
        public async Task SendDeadlineNotificationsAsync_NoProjectMembers_NoNotificationsSent()
        {
            var iteration = new Iteration { Id = 100, ProjectId = 200 };
            var stride = new Stride { Id = 3, Name = "Sprint A", IterationId = 100 };
            _strideRepoMock.Setup(r => r.GetStridesEndingOnAsync(It.IsAny<DateTime>()))
                           .ReturnsAsync(new List<Stride> { stride });
            _iterationRepoMock.Setup(r => r.GetByIdAsync(100)).ReturnsAsync(iteration);
            _projectServiceMock.Setup(p => p.GetProjectMembersAsync(200))
                               .ReturnsAsync(new List<ProjectMemberDTO>());

            await _service.SendDeadlineNotificationsAsync();

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()),
                Times.Never);
        }

        [Test]
        public async Task SendDeadlineNotificationsAsync_SendsNotificationsToAllMembers()
        {
            var iteration = new Iteration { Id = 1, ProjectId = 5 };
            var stride = new Stride { Id = 10, Name = "Sprint 1", IterationId = 1 };
            var members = new List<ProjectMemberDTO>
            {
                new ProjectMemberDTO { UserId = 100, UserName = "Alice" },
                new ProjectMemberDTO { UserId = 200, UserName = "Bob" }
            };

            _strideRepoMock.Setup(r => r.GetStridesEndingOnAsync(It.IsAny<DateTime>()))
                           .ReturnsAsync(new List<Stride> { stride });
            _iterationRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(iteration);
            _projectServiceMock.Setup(p => p.GetProjectMembersAsync(5)).ReturnsAsync(members);

            await _service.SendDeadlineNotificationsAsync();

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                100,
                NotificationType.StrideEnding,
                "Stride 'Sprint 1' ends in 3 days.",
                "/projects/5/strides"
            ), Times.Once);

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                200,
                NotificationType.StrideEnding,
                "Stride 'Sprint 1' ends in 3 days.",
                "/projects/5/strides"
            ), Times.Once);
        }

        [Test]
        public async Task SendDeadlineNotificationsAsync_MultipleStrides_SendsForEach()
        {
            var iteration1 = new Iteration { Id = 1, ProjectId = 10 };
            var iteration2 = new Iteration { Id = 2, ProjectId = 20 };
            var stride1 = new Stride { Id = 1, Name = "S1", IterationId = 1 };
            var stride2 = new Stride { Id = 2, Name = "S2", IterationId = 2 };
            var members1 = new List<ProjectMemberDTO> { new ProjectMemberDTO { UserId = 1 } };
            var members2 = new List<ProjectMemberDTO> { new ProjectMemberDTO { UserId = 2 } };

            _strideRepoMock.Setup(r => r.GetStridesEndingOnAsync(It.IsAny<DateTime>()))
                           .ReturnsAsync(new List<Stride> { stride1, stride2 });
            _iterationRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(iteration1);
            _iterationRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(iteration2);
            _projectServiceMock.Setup(p => p.GetProjectMembersAsync(10)).ReturnsAsync(members1);
            _projectServiceMock.Setup(p => p.GetProjectMembersAsync(20)).ReturnsAsync(members2);

            await _service.SendDeadlineNotificationsAsync();

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(1, It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(2, It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        #endregion
    }
}