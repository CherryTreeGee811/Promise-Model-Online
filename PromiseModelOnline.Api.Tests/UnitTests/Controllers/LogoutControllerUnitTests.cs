using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

            var httpContext = new DefaultHttpContext();

            // ✅ Set Authorization header
            httpContext.Request.Headers["Authorization"] = "Bearer test-access-token";

            // ✅ Set refresh token cookie (using mock)
            var mockCookies = new Mock<IRequestCookieCollection>();
            mockCookies.Setup(c => c["refreshToken"])
                    .Returns("valid-refresh-token-123");

            httpContext.Request.Cookies = mockCookies.Object;

            _controller = new LogoutController(_authClientMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = httpContext
                }
            };
        }

        [Test]
        public async Task Logout_WhenAuthServiceSucceeds_ReturnsNoContent()
        {
            _authClientMock
                .Setup(x => x.LogoutAsync(
                    It.Is<LogoutRequest>(r => r.RefreshToken == "valid-refresh-token-123"),
                    "Bearer test-access-token"))
                .Returns(Task.CompletedTask);

            var result = await _controller.Logout();

            Assert.That(result, Is.InstanceOf<NoContentResult>());

            _authClientMock.Verify(x => x.LogoutAsync(
                It.Is<LogoutRequest>(r => r.RefreshToken == "valid-refresh-token-123"),
                "Bearer test-access-token"),
                Times.Once);
        }

        [Test]
        public async Task Logout_WhenRefreshTokenIsInvalid_ReturnsUnauthorized()
        {
            _authClientMock
                .Setup(x => x.LogoutAsync(
                    It.IsAny<LogoutRequest>(),
                    "Bearer test-access-token"))
                .ThrowsAsync(new UnauthorizedAccessException());

            var result = await _controller.Logout();

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task Logout_WhenAuthServiceThrowsUnexpectedError_ReturnsServerError()
        {
            _authClientMock
                .Setup(x => x.LogoutAsync(
                    It.IsAny<LogoutRequest>(),
                    "Bearer test-access-token"))
                .ThrowsAsync(new Exception("boom"));

            var result = await _controller.Logout();

            Assert.That(result, Is.InstanceOf<ObjectResult>());

            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult.Value, Is.EqualTo("Internal server error"));
        }
    }
}