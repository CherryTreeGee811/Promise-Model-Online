using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class ChangePasswordControllerUnitTests
    {
        private Mock<IAuthClient> _authClientMock = null!;
        private ChangePasswordController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _authClientMock = new Mock<IAuthClient>();
            _controller = new ChangePasswordController(_authClientMock.Object, NullLogger<ChangePasswordController>.Instance);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        #region Happy Path Tests

        [Test]
        public async Task ChangePassword_WithValidRequest_ReturnsNoContent()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };
            
            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, authorizationHeader))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, authorizationHeader),
                Times.Once);
        }

        #endregion

        #region Sad Path Tests

        [Test]
        public async Task ChangePassword_WhenUnauthorizedAccessException_ReturnsUnauthorized()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            var authorizationHeader = "Bearer invalid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, authorizationHeader))
                .ThrowsAsync(new UnauthorizedAccessException("Invalid credentials"));

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task ChangePassword_WhenArgumentException_ReturnsBadRequest()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, authorizationHeader))
                .ThrowsAsync(new ArgumentException("Password requirements not met"));

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult?.Value, Is.EqualTo("Bad request"));
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task ChangePassword_WhenGenericException_ReturnsInternalServerError()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, authorizationHeader))
                .ThrowsAsync(new Exception("Unexpected error"));

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<ObjectResult>());
            var objectResult = result as ObjectResult;
            Assert.That(objectResult?.StatusCode, Is.EqualTo(500));
            Assert.That(objectResult?.Value, Is.EqualTo("Internal server error"));
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task ChangePassword_WhenAuthorizationHeaderIsMissing_PassesEmptyStringToAuthClient()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            // No Authorization header set - will default to empty string
            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, ""))
                .ThrowsAsync(new UnauthorizedAccessException("Missing authorization"));

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, ""),
                Times.Once);
        }

        [Test]
        public async Task ChangePassword_WhenCurrentPasswordIsIncorrect_ReturnsBadRequest()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "WrongPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, authorizationHeader))
                .ThrowsAsync(new UnauthorizedAccessException("Current password is incorrect"));

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, authorizationHeader),
                Times.Once);
        }

        [Test]
        public async Task ChangePassword_WhenNewPasswordDoesNotMeetRequirements_ReturnsBadRequest()
        {
            // Arrange
            var request = new ChangePasswordRequest
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "weak",
                ConfirmPassword = "weak"
            };

            var authorizationHeader = "Bearer valid-token";
            _controller.ControllerContext.HttpContext.Request.Headers["Authorization"] = authorizationHeader;

            _authClientMock
                .Setup(x => x.ChangePasswordAsync(request, authorizationHeader))
                .ThrowsAsync(new ArgumentException("New password does not meet complexity requirements"));

            // Act
            var result = await _controller.ChangePassword(request);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That(badRequestResult?.Value, Is.EqualTo("Bad request"));
            _authClientMock.Verify(
                x => x.ChangePasswordAsync(request, authorizationHeader),
                Times.Once);
        }

        #endregion
    }
}
