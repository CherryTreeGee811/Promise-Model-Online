using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class RegisterControllerUnitTests
    {
        private Mock<IAuthClient> _authClientMock = null!;
        private Mock<IUserRepository> _userRepositoryMock = null!;
        private RegisterController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _authClientMock = new Mock<IAuthClient>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _controller = new RegisterController(_authClientMock.Object, _userRepositoryMock.Object);
        }

        [Test]
        public async Task Register_WhenAuthServiceReturnsResponse_ReturnsCreatedAndCreatesLocalUser()
        {
            var request = new RegisterRequest
            {
                UserName = "new-user",
                Email = "new-user@example.com",
                Password = "P@ssw0rd!"
            };

            var response = new RegisterResponse
            {
                Created = true,
                UserName = request.UserName,
                Email = request.Email
            };

            _authClientMock.Setup(x => x.RegisterAsync(request)).ReturnsAsync(response);

            var result = await _controller.Register(request);

            Assert.That(result, Is.InstanceOf<CreatedResult>());
            var created = result as CreatedResult;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.Value, Is.SameAs(response));

            _authClientMock.Verify(x => x.RegisterAsync(request), Times.Once);
            _userRepositoryMock.Verify(x => x.GetOrCreateUserByEmailAsync(request.Email, request.UserName), Times.Once);
        }

        [Test]
        public async Task Register_WhenUserAlreadyExists_ReturnsConflict()
        {
            var request = new RegisterRequest
            {
                UserName = "existing-user",
                Email = "existing-user@example.com",
                Password = "P@ssw0rd!"
            };

            _authClientMock.Setup(x => x.RegisterAsync(request)).ReturnsAsync((RegisterResponse?)null);

            var result = await _controller.Register(request);

            Assert.That(result, Is.InstanceOf<ConflictObjectResult>());
            var conflict = result as ConflictObjectResult;
            Assert.That(conflict, Is.Not.Null);
            Assert.That(conflict!.Value, Is.EqualTo("User already exists"));

            _authClientMock.Verify(x => x.RegisterAsync(request), Times.Once);
            _userRepositoryMock.Verify(x => x.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }

        [Test]
        public async Task Register_WhenRequestIsInvalid_ReturnsBadRequest()
        {
            var request = new RegisterRequest
            {
                UserName = "bad-user",
                Email = "bad-user@example.com",
                Password = "P@ssw0rd!"
            };

            _authClientMock.Setup(x => x.RegisterAsync(request)).ThrowsAsync(new ArgumentException("invalid request"));

            var result = await _controller.Register(request);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Is.EqualTo("Bad request"));

            _userRepositoryMock.Verify(x => x.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }

        [Test]
        public async Task Register_WhenRegistrationIsForbidden_ReturnsForbid()
        {
            var request = new RegisterRequest
            {
                UserName = "forbidden-user",
                Email = "forbidden-user@example.com",
                Password = "P@ssw0rd!"
            };

            _authClientMock.Setup(x => x.RegisterAsync(request)).ThrowsAsync(new System.Security.SecurityException("forbidden"));

            var result = await _controller.Register(request);

            Assert.That(result, Is.InstanceOf<ForbidResult>());
            _userRepositoryMock.Verify(x => x.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }

        [Test]
        public async Task Register_WhenAuthServiceThrowsUnexpectedError_ReturnsServerError()
        {
            var request = new RegisterRequest
            {
                UserName = "error-user",
                Email = "error-user@example.com",
                Password = "P@ssw0rd!"
            };

            _authClientMock.Setup(x => x.RegisterAsync(request)).ThrowsAsync(new System.Exception("boom"));

            var result = await _controller.Register(request);

            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult, Is.Not.Null);
            Assert.That(objectResult!.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult.Value, Is.EqualTo("Internal server error"));

            _userRepositoryMock.Verify(x => x.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }
    }
}