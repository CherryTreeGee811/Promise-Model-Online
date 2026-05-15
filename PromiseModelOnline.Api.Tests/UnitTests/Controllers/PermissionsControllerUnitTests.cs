using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        [SetUp]
        public void SetUp()
        {
            _permissionServiceMock = new Mock<IPermissionService>();
            _userRepositoryMock = new Mock<IUserRepository>();
            _controller = new PermissionsController(_permissionServiceMock.Object, _userRepositoryMock.Object);
        }

        private void SetCurrentUser(string? email, string? nameId = null)
        {
            var claims = new List<Claim>();
            if (email is not null)
            {
                claims.Add(new Claim(ClaimTypes.Email, email));
            }

            if (nameId is not null)
            {
                claims.Add(new Claim("nameid", nameId));
            }

            var identity = new ClaimsIdentity(claims, "test");
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        [Test]
        public async Task GetPermissions_WithProjectId_ReturnsOkWithPermissions()
        {
            var permissions = new List<PermissionDTO>
            {
                new PermissionDTO { Id = 1, UserId = 10, UserName = "User One", ProjectId = 99, Level = "Edit", Status = "Accepted" },
                new PermissionDTO { Id = 2, UserId = 11, UserName = "User Two", ProjectId = 99, Level = "View", Status = "Pending" }
            };

            _permissionServiceMock.Setup(s => s.GetPermissionsByProjectAsync(99)).ReturnsAsync(permissions);

            var result = await _controller.GetPermissions(99);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(permissions));
            _permissionServiceMock.Verify(s => s.GetPermissionsByProjectAsync(99), Times.Once);
        }

        [Test]
        public async Task InviteUser_WithAuthenticatedUser_ReturnsCreatedAtAction()
        {
            var request = new CreatePermissionRequestDTO
            {
                UserEmail = "invitee@example.com",
                ProjectId = 42,
                Level = PermissionLevel.Edit
            };
            var currentUser = new User { Id = 7, Email = "owner@example.com", Name = "Owner" };
            var createdPermission = new PermissionDTO
            {
                Id = 123,
                UserId = 88,
                UserName = "Invitee",
                ProjectId = 42,
                Level = "Edit",
                Status = "Pending"
            };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("owner@example.com", "owner-name"))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, currentUser.Id))
                .ReturnsAsync(createdPermission);

            SetCurrentUser("owner@example.com", "owner-name");

            var result = await _controller.InviteUser(request);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = result.Result as CreatedAtActionResult;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.ActionName, Is.EqualTo(nameof(PermissionsController.GetPermissions)));
            Assert.That(created.RouteValues!["projectId"], Is.EqualTo(42));
            Assert.That(created.Value, Is.SameAs(createdPermission));
            _permissionServiceMock.Verify(s => s.InviteUserAsync(request, currentUser.Id), Times.Once);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("owner@example.com", "owner-name"), Times.Once);
        }

        [Test]
        public async Task InviteUser_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            var request = new CreatePermissionRequestDTO
            {
                UserEmail = "invitee@example.com",
                ProjectId = 42,
                Level = PermissionLevel.View
            };

            SetCurrentUser(null);

            var result = await _controller.InviteUser(request);

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _permissionServiceMock.Verify(s => s.InviteUserAsync(It.IsAny<CreatePermissionRequestDTO>(), It.IsAny<int>()), Times.Never);
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        }

        [Test]
        public async Task InviteUser_WhenServiceThrows_ReturnsBadRequest()
        {
            var request = new CreatePermissionRequestDTO
            {
                UserEmail = "invitee@example.com",
                ProjectId = 42,
                Level = PermissionLevel.Comment
            };
            var currentUser = new User { Id = 7, Email = "owner@example.com", Name = "Owner" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("owner@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.InviteUserAsync(request, currentUser.Id))
                .ThrowsAsync(new System.Exception("invite failed"));

            SetCurrentUser("owner@example.com");

            var result = await _controller.InviteUser(request);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Is.EqualTo("invite failed"));
            _permissionServiceMock.Verify(s => s.InviteUserAsync(request, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task AcceptInvitation_WithAuthenticatedUser_ReturnsOkWithPermission()
        {
            var request = new AcceptInvitationRequestDTO { PermissionId = 55 };
            var currentUser = new User { Id = 9, Email = "member@example.com", Name = "Member" };
            var acceptedPermission = new PermissionDTO
            {
                Id = 55,
                UserId = 9,
                UserName = "Member",
                ProjectId = 42,
                Level = "Comment",
                Status = "Accepted"
            };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("member@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.AcceptInvitationAsync(request.PermissionId, currentUser.Id))
                .ReturnsAsync(acceptedPermission);

            SetCurrentUser("member@example.com");

            var result = await _controller.AcceptInvitation(request);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(acceptedPermission));
            _permissionServiceMock.Verify(s => s.AcceptInvitationAsync(request.PermissionId, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task AcceptInvitation_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            var request = new AcceptInvitationRequestDTO { PermissionId = 55 };

            SetCurrentUser(null);

            var result = await _controller.AcceptInvitation(request);

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _permissionServiceMock.Verify(s => s.AcceptInvitationAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task AcceptInvitation_WhenServiceThrows_ReturnsBadRequest()
        {
            var request = new AcceptInvitationRequestDTO { PermissionId = 55 };
            var currentUser = new User { Id = 9, Email = "member@example.com", Name = "Member" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("member@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.AcceptInvitationAsync(request.PermissionId, currentUser.Id))
                .ThrowsAsync(new System.Exception("accept failed"));

            SetCurrentUser("member@example.com");

            var result = await _controller.AcceptInvitation(request);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Is.EqualTo("accept failed"));
        }

        [Test]
        public async Task RevokePermission_WithAuthenticatedUser_ReturnsNoContent()
        {
            var currentUser = new User { Id = 13, Email = "owner@example.com", Name = "Owner" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("owner@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.RemovePermissionAsync(77, currentUser.Id))
                .Returns(Task.CompletedTask);

            SetCurrentUser("owner@example.com");

            var result = await _controller.RevokePermission(77);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _permissionServiceMock.Verify(s => s.RemovePermissionAsync(77, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task RevokePermission_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.RevokePermission(77);

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _permissionServiceMock.Verify(s => s.RemovePermissionAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task RevokePermission_WhenServiceThrows_ReturnsBadRequest()
        {
            var currentUser = new User { Id = 13, Email = "owner@example.com", Name = "Owner" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("owner@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.RemovePermissionAsync(77, currentUser.Id))
                .ThrowsAsync(new System.Exception("revoke failed"));

            SetCurrentUser("owner@example.com");

            var result = await _controller.RevokePermission(77);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Is.EqualTo("revoke failed"));
        }

        [Test]
        public async Task GetPendingInvitations_WithAuthenticatedUser_ReturnsOkWithInvitations()
        {
            var currentUser = new User { Id = 21, Email = "member@example.com", Name = "Member" };
            var invitations = new List<PendingInvitationDTO>
            {
                new PendingInvitationDTO { PermissionId = 1, ProjectId = 90, ProjectName = "Project A", Level = "View", Status = "Pending" }
            };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("member@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.GetPendingInvitationsForUserAsync(currentUser.Id))
                .ReturnsAsync(invitations);

            SetCurrentUser("member@example.com");

            var result = await _controller.GetPendingInvitations();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(invitations));
        }

        [Test]
        public async Task GetPendingInvitations_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.GetPendingInvitations();

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _permissionServiceMock.Verify(s => s.GetPendingInvitationsForUserAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetMyPermission_WithPermission_ReturnsOkWithLevelName()
        {
            var currentUser = new User { Id = 31, Email = "member@example.com", Name = "Member" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("member@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(currentUser.Id, 123))
                .ReturnsAsync(PermissionLevel.Edit);

            SetCurrentUser("member@example.com");

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.EqualTo("Edit"));
        }

        [Test]
        public async Task GetMyPermission_WhenNoPermission_ReturnsNoContent()
        {
            var currentUser = new User { Id = 31, Email = "member@example.com", Name = "Member" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("member@example.com", null))
                .ReturnsAsync(currentUser);
            _permissionServiceMock
                .Setup(s => s.GetUserPermissionAsync(currentUser.Id, 123))
                .ReturnsAsync((PermissionLevel?)null);

            SetCurrentUser("member@example.com");

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task GetMyPermission_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            SetCurrentUser(null);

            var result = await _controller.GetMyPermission(123);

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _permissionServiceMock.Verify(s => s.GetUserPermissionAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }
    }
}
