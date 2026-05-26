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
                .Setup(r => r.GetOrCreateUserByEmailAsync(email, It.IsAny<string?>()))
                .ReturnsAsync(user);

            SetCurrentUser(email);

            return user;
        }

        // ✅ GET PERMISSIONS

        [Test]
        public async Task GetPermissions_HappyPath_ReturnsOk()
        {
            var data = new List<PermissionDTO> { new PermissionDTO { Id = 1 } };

            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            _permissionServiceMock
                .Setup(s => s.GetPermissionsByProjectAsync(99))
                .ReturnsAsync(data);

            // ✅ THIS is what your controller actually uses
            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    PermissionLevel.View))   // ✅ must match View
                .ReturnsAsync(true);

            var result = await _controller.GetPermissions(99);

            Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        }

        [Test]
        public async Task GetPermissions_NoPermission_ReturnsForbid()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(user.Id, 99, PermissionLevel.View))
                .ReturnsAsync(false);

            var result = await _controller.GetPermissions(99);

            Assert.That(result.Result, Is.TypeOf<ForbidResult>());
        }

        [Test]
        public async Task GetPermissions_EmptyList_ReturnsOk()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            _permissionServiceMock
                .Setup(s => s.GetPermissionsByProjectAsync(99))
                .ReturnsAsync(new List<PermissionDTO>());

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    PermissionLevel.View))
                .ReturnsAsync(true);

            var result = await _controller.GetPermissions(99);

            var ok = result.Result as OkObjectResult;

            Assert.That(ok, Is.Not.Null);
        }

        [Test]
        public async Task GetPermissions_NoEmailClaim_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity()) // no claims
                }
            };

            var result = await _controller.GetPermissions(99);

            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }

        // ✅ INVITE USER

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

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, user.Id))
                .ReturnsAsync(new PermissionDTO());

            var result = await _controller.InviteUser(request);

            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task InviteUser_WhenNoEmail_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.InviteUser(new CreatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task InviteUser_InvalidOperation_ReturnsBadRequest()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(It.IsAny<CreatePermissionRequestDTO>(), user.Id))
                .ThrowsAsync(new InvalidOperationException());

            var result = await _controller.InviteUser(new CreatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task InviteUser_NullRequest_ReturnsBadRequest()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            var result = await _controller.InviteUser(null!);

            Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task InviteUser_KeyNotFound_ReturnsNotFound()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(It.IsAny<CreatePermissionRequestDTO>(), user.Id))
                .ThrowsAsync(new KeyNotFoundException());

            var result = await _controller.InviteUser(new CreatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task InviteUser_UnexpectedError_Returns500()
        {
            var user = SetupCurrentUser(OWNER_EMAIL, 1);

            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(It.IsAny<CreatePermissionRequestDTO>(), user.Id))
                .ThrowsAsync(new Exception());

            var result = await _controller.InviteUser(new CreatePermissionRequestDTO());

            Assert.That(result.Result, Is.TypeOf<ObjectResult>());
        }
    }
}