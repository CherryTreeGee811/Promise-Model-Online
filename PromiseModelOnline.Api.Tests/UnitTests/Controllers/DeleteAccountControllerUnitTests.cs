using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class DeleteAccountControllerUnitTests
    {
        private Mock<IAuthClient> _authClientMock = null!;
        private DeleteAccountController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _authClientMock = new Mock<IAuthClient>();
            _controller = new DeleteAccountController(_authClientMock.Object);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        #region Happy Path Tests

        [Test]
        public async Task DeleteAccount_WithValidRequest_ReturnsNoContent()
        {
            // Arrange
            var request = new DeleteAccountRequest
            {
                Password = "ValidPassword123!"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.DeleteAccountAsync(request, authorizationHeader))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteAccount(request);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _authClientMock.Verify(
                x => x.DeleteAccountAsync(request, authorizationHeader),
                Times.Once);
        }

        #endregion

        #region Sad Path Tests

        [Test]
        public async Task DeleteAccount_WhenUnauthorizedAccessException_ReturnsUnauthorized()
        {
            // Arrange
            var request = new DeleteAccountRequest
            {
                Password = "InvalidPassword123!"
            };

            var authorizationHeader = "Bearer invalid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.DeleteAccountAsync(request, authorizationHeader))
                .ThrowsAsync(new UnauthorizedAccessException("User not authorized to delete account"));

            // Act
            var result = await _controller.DeleteAccount(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorizedResult = result as UnauthorizedObjectResult;
            Assert.That(unauthorizedResult?.Value, Is.EqualTo("Unauthorized"));
            _authClientMock.Verify(
                x => x.DeleteAccountAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task DeleteAccount_WhenArgumentException_ReturnsBadRequest()
        {
            // Arrange
            var request = new DeleteAccountRequest
            {
                Password = "Password123!"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.DeleteAccountAsync(request, authorizationHeader))
                .ThrowsAsync(new ArgumentException("Invalid request parameters"));

            // Act
            var result = await _controller.DeleteAccount(request);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult?.Value, Is.EqualTo("Bad request"));
            _authClientMock.Verify(
                x => x.DeleteAccountAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task DeleteAccount_WhenGenericException_ReturnsInternalServerError()
        {
            // Arrange
            var request = new DeleteAccountRequest
            {
                Password = "Password123!"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.DeleteAccountAsync(request, authorizationHeader))
                .ThrowsAsync(new Exception("Unexpected database error"));

            // Act
            var result = await _controller.DeleteAccount(request);

            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult?.Value, Is.EqualTo("Internal server error"));
            _authClientMock.Verify(
                x => x.DeleteAccountAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task DeleteAccount_WithMissingAuthorizationHeader_ThrowsException()
        {
            // Arrange
            var request = new DeleteAccountRequest
            {
                Password = "Password123!"
            };

            // Authorization header not set (empty)
            _authClientMock
                .Setup(x => x.DeleteAccountAsync(request, string.Empty))
                .ThrowsAsync(new UnauthorizedAccessException("Missing authorization header"));

            // Act
            var result = await _controller.DeleteAccount(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task DeleteAccount_WhenPasswordValidationFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new DeleteAccountRequest
            {
                Password = "InvalidPassword"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.DeleteAccountAsync(request, authorizationHeader))
                .ThrowsAsync(new ArgumentException("Password does not match account credentials"));

            // Act
            var result = await _controller.DeleteAccount(request);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult?.Value, Is.EqualTo("Bad request"));
            _authClientMock.Verify(
                x => x.DeleteAccountAsync(request, authorizationHeader),
                Times.Once);
        }

        #endregion
    }
}
