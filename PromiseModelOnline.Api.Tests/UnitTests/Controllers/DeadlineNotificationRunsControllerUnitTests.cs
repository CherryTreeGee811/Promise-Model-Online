using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using System.Threading.Tasks;

namespace PromiseModelOnline.Api.Tests.UnitTests.Controllers
{
    [TestFixture]
    /// <summary>Unit tests for <see cref="DeadlineNotificationRunsController"/> covering notification triggers.</summary>
    // Requirements: REQ_FUN_038
    public class DeadlineNotificationRunsControllerUnitTests
    {
        private Mock<IStrideService> _strideServiceMock = null!;
        private DeadlineNotificationRunsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _strideServiceMock = new Mock<IStrideService>();
            _controller = new DeadlineNotificationRunsController(_strideServiceMock.Object, NullLogger<DeadlineNotificationRunsController>.Instance)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };
        }

        [Test]
        public async Task REQ_FUN_038_Create_ReturnsNoContentAndCallsService()
        {
            // Arrange
            _strideServiceMock
                .Setup(s => s.SendDeadlineNotificationsAsync())
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Create();

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _strideServiceMock.Verify(s => s.SendDeadlineNotificationsAsync(), Times.Once);
        }
    }
}
