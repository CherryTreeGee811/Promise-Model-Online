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
            _controller = new LogoutController(_authClientMock.Object);
        }

        [Test]
        public async Task Logout_WhenAuthServiceSucceeds_ReturnsOk()
        {
            var request = new LogoutRequest
            {
                RefreshToken = "valid-refresh-token-123"
            };

            _authClientMock.Setup(x => x.LogoutAsync(request)).Returns(Task.CompletedTask);

            var result = await _controller.Logout(request);

            Assert.That(result, Is.InstanceOf<OkResult>());

            _authClientMock.Verify(x => x.LogoutAsync(request), Times.Once);
        }

        [Test]
        public async Task Logout_WhenRefreshTokenIsInvalid_ReturnsUnauthorized()
        {
            var request = new LogoutRequest
            {
                RefreshToken = "invalid-refresh-token"
            };

            _authClientMock.Setup(x => x.LogoutAsync(request)).ThrowsAsync(new UnauthorizedAccessException());

            var result = await _controller.Logout(request);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorized = result as UnauthorizedObjectResult;
            Assert.That(unauthorized, Is.Not.Null);
            Assert.That(unauthorized!.Value, Is.EqualTo("Invalid refresh token"));

            _authClientMock.Verify(x => x.LogoutAsync(request), Times.Once);
        }

        [Test]
        public async Task Logout_WhenAuthServiceThrowsUnexpectedError_ReturnsServerError()
        {
            var request = new LogoutRequest
            {
                RefreshToken = "valid-refresh-token"
            };

            _authClientMock.Setup(x => x.LogoutAsync(request)).ThrowsAsync(new System.Exception("Database connection failed"));

            var result = await _controller.Logout(request);

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult.Value, Is.EqualTo("Internal server error"));

            _authClientMock.Verify(x => x.LogoutAsync(request), Times.Once);
        }

        [Test]
        public async Task Logout_WhenRequestIsNull_ReturnsServerError()
        {
            _authClientMock.Setup(x => x.LogoutAsync(null!)).ThrowsAsync(new ArgumentNullException(nameof(LogoutRequest)));

            var result = await _controller.Logout(null!);

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));

            _authClientMock.Verify(x => x.LogoutAsync(null!), Times.Once);
        }
    }
}
