using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;

namespace PromiseModelOnline.Api.Tests.UnitTests.Controllers
{
    [TestFixture]
    public class DeadlineNotificationRunsControllerUnitTests
    {
        private Mock<IStrideService> _strideServiceMock = null!;
        private DeadlineNotificationRunsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _strideServiceMock = new Mock<IStrideService>();

            _controller = new DeadlineNotificationRunsController(
                _strideServiceMock.Object
            );

            // ✅ FIX: add authenticated user
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.Email, "user@test.com")
                    }, "test"))
                }
            };
        }

        [Test]
        public async Task Create_ReturnsNoContentAndCallsService()
        {
            _strideServiceMock
                .Setup(s => s.SendDeadlineNotificationsAsync())
                .Returns(Task.CompletedTask);

            var result = await _controller.Create();

            Assert.That(result, Is.InstanceOf<NoContentResult>());

            _strideServiceMock.Verify(
                s => s.SendDeadlineNotificationsAsync(),
                Times.Once);
        }
    }
}