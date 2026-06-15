using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    /// <summary>Unit tests for <see cref="PermissionsController"/> covering invitation CRUD.</summary>
// Requirements: REQ_FUN_013 REQ_FUN_014
    public class PermissionsControllerUnitTests
    {
        private Mock<IPermissionService> _permissionServiceMock = null!;
        private Mock<IUserRepository> _userRepositoryMock = null!;
        private PermissionsController _controller = null!;

        private const string MEMBER_EMAIL = "member@example.com";
        private const string OWNER_EMAIL = "owner@example.com";

        [SetUp]
        public void SetUp()
        {
            _permissionServiceMock = new Mock<IPermissionService>();
            _userRepositoryMock = new Mock<IUserRepository>();

            _controller = new PermissionsController(
                _permissionServiceMock.Object,
                _userRepositoryMock.Object,
                NullLogger<PermissionsController>.Instance);
        }

        private User SetupCurrentUser(string email, int id)
        {
            var user = new User { Id = id, Email = email };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync(
                    It.Is<string>(e => e == email),
                    It.IsAny<string?>()))
                .ReturnsAsync(user);

            ControllerTestHelpers.SetControllerUser(_controller, email);

            return user;
        }

        // -----------------------------
        // GET PERMISSIONS
        // -----------------------------

        [Test]
        public async Task REQ_FUN_013_GetPermissions_HappyPath_ReturnsOk()
        {
            // Arrange
            var data = new List<PermissionDTO> { new PermissionDTO { Id = 1 } };

            _permissionServiceMock
                .Setup(s => s.GetPermissionsByProjectAsync(99))
                .ReturnsAsync(data);

            // Act
            var result = await _controller.GetPermissions(99);

            // Assert
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
            var ok = (OkObjectResult)result.Result!;
            Assert.That(ok.Value, Is.SameAs(data));
        }

        // -----------------------------
        // INVITE USER
        // -----------------------------

        [Test]
        public async Task REQ_FUN_013_InviteUser_HappyPath_ReturnsCreated()
        {
            // Arrange
            var request = new CreatePermissionRequestDTO
            {
                Email = "invitee@example.com",
                ProjectId = 42,
                Level = PermissionLevel.Edit
            };

            var user = SetupCurrentUser(OWNER_EMAIL, 7);
            var created = new PermissionDTO { Id = 123 };

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, user.Id))
                .ReturnsAsync(created);

            // Act
            var result = await _controller.InviteUser(request);

            // Assert
            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());

            _permissionServiceMock.Verify(s =>
                s.InviteUserAsync(request, user.Id), Times.Once);
        }

        [Test]
        public async Task REQ_FUN_013_InviteUser_WhenNoEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.InviteUser(new CreatePermissionRequestDTO());

            // Assert
            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task REQ_FUN_013_InviteUser_WhenServiceThrows_ReturnsBadRequest()
        {
            // Arrange
            var request = new CreatePermissionRequestDTO { ProjectId = 42 };
            var user = SetupCurrentUser(OWNER_EMAIL, 7);

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, user.Id))
                .ThrowsAsync(new System.Exception());

            // Act
            var result = await _controller.InviteUser(request);

            // Assert
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        // -----------------------------
        // UPDATE PERMISSION
        // -----------------------------

        [Test]
        public async Task REQ_FUN_013_UpdatePermission_HappyPath_ReturnsOk()
        {
            // Arrange
            var user = SetupCurrentUser(MEMBER_EMAIL, 9);

            _permissionServiceMock
                .Setup(s => s.AcceptInvitationAsync(55, user.Id))
                .ReturnsAsync(new PermissionDTO());

            // Act
            var result = await _controller.UpdatePermissionStatus(55, new UpdatePermissionRequestDTO());

            // Assert
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task REQ_FUN_013_UpdatePermission_WhenNoEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.UpdatePermissionStatus(55, new UpdatePermissionRequestDTO());

            // Assert
            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task REQ_FUN_013_UpdatePermission_WhenServiceThrows_ReturnsBadRequest()
        {
            // Arrange
            var user = SetupCurrentUser(MEMBER_EMAIL, 9);

            _permissionServiceMock
                .Setup(s => s.AcceptInvitationAsync(55, user.Id))
                .ThrowsAsync(new System.Exception());

            // Act
            var result = await _controller.UpdatePermissionStatus(55, new UpdatePermissionRequestDTO());

            // Assert
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        // -----------------------------
        // REVOKE PERMISSION
        // -----------------------------

        [Test]
        public async Task REQ_FUN_013_RevokePermission_HappyPath_ReturnsNoContent()
        {
            // Arrange
            var user = SetupCurrentUser(OWNER_EMAIL, 13);

            _permissionServiceMock
                .Setup(s => s.RemovePermissionAsync(77, user.Id))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.RevokePermission(77);

            // Assert
            Assert.That(result, Is.TypeOf<NoContentResult>());
        }

        [Test]
        public async Task REQ_FUN_013_RevokePermission_WhenNoEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.RevokePermission(77);

            // Assert
            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task REQ_FUN_013_RevokePermission_WhenServiceThrows_ReturnsBadRequest()
        {
            // Arrange
            var user = SetupCurrentUser(OWNER_EMAIL, 13);

            _permissionServiceMock
                .Setup(s => s.RemovePermissionAsync(77, user.Id))
                .ThrowsAsync(new System.Exception());

            // Act
            var result = await _controller.RevokePermission(77);

            // Assert
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        // -----------------------------
        // GET MY PERMISSION
        // -----------------------------

        [Test]
        public async Task REQ_FUN_013_GetMyPermission_HappyPath_ReturnsOk()
        {
            // Arrange
            var user = SetupCurrentUser(MEMBER_EMAIL, 31);

            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(user.Id, 123))
                .ReturnsAsync(PermissionLevel.Edit);

            // Act
            var result = await _controller.GetMyPermission(123);

            // Assert
            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task REQ_FUN_013_GetMyPermission_WhenNoPermission_ReturnsNoContent()
        {
            // Arrange
            var user = SetupCurrentUser(MEMBER_EMAIL, 31);

            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(user.Id, 123))
                .ReturnsAsync((PermissionLevel?)null);

            // Act
            var result = await _controller.GetMyPermission(123);

            // Assert
            Assert.That(result.Result, Is.TypeOf<NoContentResult>());
        }

        [Test]
        public async Task REQ_FUN_013_GetMyPermission_WhenServiceThrows_ReturnsBadRequest()
        {
            // Arrange
            var user = SetupCurrentUser(MEMBER_EMAIL, 31);

            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(user.Id, 123))
                .ThrowsAsync(new System.Exception());

            // Act
            var result = await _controller.GetMyPermission(123);

            // Assert
            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task REQ_FUN_013_GetMyPermission_WhenNoEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);

            // Act
            var result = await _controller.GetMyPermission(123);

            // Assert
            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }
    }
}