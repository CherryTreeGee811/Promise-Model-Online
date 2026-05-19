using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
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

        private void SetCurrentUser(string? email)
        {
            var claims = new List<Claim>();

            if (email != null)
                claims.Add(new Claim(ClaimTypes.Email, email));

            var identity = new ClaimsIdentity(claims, "test");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        private User SetupCurrentUser(string email, int id)
        {
            var user = new User { Id = id, Email = email };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync(
                    It.Is<string>(e => e == email),
                    It.IsAny<string?>()))
                .ReturnsAsync(user);

            SetCurrentUser(email);

            return user;
        }

        // -----------------------------
        // GET PERMISSIONS
        // -----------------------------

        [Test]
        public async Task GetPermissions_HappyPath_ReturnsOk()
        {
            var data = new List<PermissionDTO> { new PermissionDTO { Id = 1 } };

            _permissionServiceMock
                .Setup(s => s.GetPermissionsByProjectAsync(99))
                .ReturnsAsync(data);

            var result = await _controller.GetPermissions(99);

            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
            var ok = (OkObjectResult)result.Result!;
            Assert.That(ok.Value, Is.SameAs(data));
        }

        // -----------------------------
        // INVITE USER
        // -----------------------------

        [Test]
        public async Task InviteUser_HappyPath_ReturnsCreated()
        {
            var request = new CreatePermissionRequestDTO
            {
                UserEmail = "invitee@example.com",
                ProjectId = 42,
                Level = PermissionLevel.Edit
            };

            var user = SetupCurrentUser(OWNER_EMAIL, 7);
            var created = new PermissionDTO { Id = 123 };

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, user.Id))
                .ReturnsAsync(created);

            var result = await _controller.InviteUser(request);

            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());

            _permissionServiceMock.Verify(s =>
                s.InviteUserAsync(request, user.Id), Times.Once);
        }

        [Test]
        public async Task InviteUser_WhenNoEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.InviteUser(new CreatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task InviteUser_WhenServiceThrows_ReturnsBadRequest()
        {
            var request = new CreatePermissionRequestDTO { ProjectId = 42 };
            var user = SetupCurrentUser(OWNER_EMAIL, 7);

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, user.Id))
                .ThrowsAsync(new System.Exception());

            var result = await _controller.InviteUser(request);

            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        // -----------------------------
        // UPDATE PERMISSION
        // -----------------------------

        [Test]
        public async Task UpdatePermission_HappyPath_ReturnsOk()
        {
            var user = SetupCurrentUser(MEMBER_EMAIL, 9);

            _permissionServiceMock
                .Setup(s => s.AcceptInvitationAsync(55, user.Id))
                .ReturnsAsync(new PermissionDTO());

            var result = await _controller.UpdatePermissionStatus(55, new UpdatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdatePermission_WhenNoEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.UpdatePermissionStatus(55, new UpdatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task UpdatePermission_WhenServiceThrows_ReturnsBadRequest()
        {
            var user = SetupCurrentUser(MEMBER_EMAIL, 9);

            _permissionServiceMock
                .Setup(s => s.AcceptInvitationAsync(55, user.Id))
                .ThrowsAsync(new System.Exception());

            var result = await _controller.UpdatePermissionStatus(55, new UpdatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        // -----------------------------
        // REVOKE PERMISSION
        // -----------------------------

        [Test]
        public async Task RevokePermission_HappyPath_ReturnsNoContent()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 13);

            _permissionServiceMock
                .Setup(s => s.RemovePermissionAsync(77, user.Id))
                .Returns(Task.CompletedTask);

            var result = await _controller.RevokePermission(77);

            Assert.That(result, Is.TypeOf<NoContentResult>());
        }

        [Test]
        public async Task RevokePermission_WhenNoEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.RevokePermission(77);

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task RevokePermission_WhenServiceThrows_ReturnsBadRequest()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 13);

            _permissionServiceMock
                .Setup(s => s.RemovePermissionAsync(77, user.Id))
                .ThrowsAsync(new System.Exception());

            var result = await _controller.RevokePermission(77);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        // -----------------------------
        // GET MY PERMISSION
        // -----------------------------

        [Test]
        public async Task GetMyPermission_HappyPath_ReturnsOk()
        {
            var user = SetupCurrentUser(MEMBER_EMAIL, 31);

            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(user.Id, 123))
                .ReturnsAsync(PermissionLevel.Edit);

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetMyPermission_WhenNoPermission_ReturnsNoContent()
        {
            var user = SetupCurrentUser(MEMBER_EMAIL, 31);

            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(user.Id, 123))
                .ReturnsAsync((PermissionLevel?)null);

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.TypeOf<NoContentResult>());
        }

        [Test]
        public async Task GetMyPermission_WhenServiceThrows_ReturnsBadRequest()
        {
            var user = SetupCurrentUser(MEMBER_EMAIL, 31);

            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(user.Id, 123))
                .ThrowsAsync(new System.Exception());

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetMyPermission_WhenNoEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }
    }
}