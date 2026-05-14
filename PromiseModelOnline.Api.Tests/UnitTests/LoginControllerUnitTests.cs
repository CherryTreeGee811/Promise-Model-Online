using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class LoginControllerUnitTests
    {
        private Mock<IAuthClient> _authClientMock = null!;
        private LoginController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _authClientMock = new Mock<IAuthClient>();
            _controller = new LoginController(_authClientMock.Object);
        }

        [Test]
        public async Task Login_WhenAuthServiceReturnsToken_ReturnsOk()
        {
            var request = new UserLogin
            {
                UserName = "test-user",
                Password = "P@ssw0rd!"
            };

            var response = new TokenResponse
            {
                AccessToken = "access",
                RefreshToken = "refresh"
            };

            _authClientMock.Setup(x => x.LoginAsync(request)).ReturnsAsync(response);

            var result = await _controller.Login(request);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok!.Value, Is.SameAs(response));

            _authClientMock.Verify(x => x.LoginAsync(request), Times.Once);
        }

        [Test]
        public async Task Login_WhenCredentialsInvalid_ReturnsUnauthorized()
        {
            var request = new UserLogin
            {
                UserName = "bad-user",
                Password = "wrong"
            };

            _authClientMock.Setup(x => x.LoginAsync(request)).ThrowsAsync(new UnauthorizedAccessException());

            var result = await _controller.Login(request);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorized = result as UnauthorizedObjectResult;
            Assert.That(unauthorized, Is.Not.Null);
            Assert.That(unauthorized!.Value, Is.EqualTo("Invalid username or password"));

            _authClientMock.Verify(x => x.LoginAsync(request), Times.Once);
        }

        [Test]
        public async Task Login_WhenAuthServiceThrowsUnexpectedError_ReturnsServerError()
        {
            var request = new UserLogin
            {
                UserName = "error-user",
                Password = "P@ssw0rd!"
            };

            _authClientMock.Setup(x => x.LoginAsync(request)).ThrowsAsync(new System.Exception("boom"));

            var result = await _controller.Login(request);

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult.Value, Is.EqualTo("Internal server error"));

            _authClientMock.Verify(x => x.LoginAsync(request), Times.Once);
        }
    }
}
