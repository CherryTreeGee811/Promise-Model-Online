using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class LogoutControllerUnitTests
    {
        private Mock<IAuthClient> _authClientMock = null!;
        private LogoutController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _authClientMock = new Mock<IAuthClient>();
            _controller = new LogoutController(_authClientMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };

            _controller.ControllerContext.HttpContext.Request.Headers.Authorization = "Bearer test-access-token";
        }

        [Test]
        public async Task Logout_WhenAuthServiceSucceeds_ReturnsNoContent()
        {
            var request = new LogoutRequest
            {
                RefreshToken = "valid-refresh-token-123"
            };

            _authClientMock
                .Setup(x => x.LogoutAsync(request, "Bearer test-access-token"))
                .Returns(Task.CompletedTask);

            var result = await _controller.Logout(request);

            Assert.That(result, Is.InstanceOf<NoContentResult>());

            _authClientMock.Verify(x => x.LogoutAsync(request, "Bearer test-access-token"), Times.Once);
        }

        [Test]
        public async Task Logout_WhenRefreshTokenIsInvalid_ReturnsUnauthorized()
        {
            var request = new LogoutRequest
            {
                RefreshToken = "invalid-refresh-token"
            };

            _authClientMock
                .Setup(x => x.LogoutAsync(request, "Bearer test-access-token"))
                .ThrowsAsync(new UnauthorizedAccessException());

            var result = await _controller.Logout(request);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorized = result as UnauthorizedObjectResult;
            Assert.That(unauthorized, Is.Not.Null);
            Assert.That(unauthorized!.Value, Is.EqualTo("Invalid refresh token"));

            _authClientMock.Verify(x => x.LogoutAsync(request, "Bearer test-access-token"), Times.Once);
        }

        [Test]
        public async Task Logout_WhenAuthServiceThrowsUnexpectedError_ReturnsServerError()
        {
            var request = new LogoutRequest
            {
                RefreshToken = "valid-refresh-token"
            };

            _authClientMock
                .Setup(x => x.LogoutAsync(request, "Bearer test-access-token"))
                .ThrowsAsync(new System.Exception("Database connection failed"));

            var result = await _controller.Logout(request);

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult.Value, Is.EqualTo("Internal server error"));

            _authClientMock.Verify(x => x.LogoutAsync(request, "Bearer test-access-token"), Times.Once);
        }

        [Test]
        public async Task Logout_WhenRequestIsNull_ReturnsServerError()
        {
            _authClientMock
                .Setup(x => x.LogoutAsync(null, "Bearer test-access-token"))
                .ThrowsAsync(new ArgumentNullException(nameof(LogoutRequest)));

            var result = await _controller.Logout(null!);

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));

            _authClientMock.Verify(x => x.LogoutAsync(null, "Bearer test-access-token"), Times.Once);
        }
    }
}
