using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class PermissionServiceUnitTests
    {
        private Mock<IPermissionRepository> _permRepoMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IGenericRepository<Project>> _projectRepoMock = null!;
        private Mock<IGenericMapper<Permission, PermissionDTO>> _mapperMock = null!;
        private Mock<INotificationService> _notifServiceMock = null!;
        private PermissionService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _permRepoMock = new Mock<IPermissionRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _projectRepoMock = new Mock<IGenericRepository<Project>>();
            _mapperMock = new Mock<IGenericMapper<Permission, PermissionDTO>>();
            _notifServiceMock = new Mock<INotificationService>();

            _service = new PermissionService(
                _permRepoMock.Object,
                _userRepoMock.Object,
                _projectRepoMock.Object,
                _mapperMock.Object,
                _notifServiceMock.Object);
        }

        #region GetPermissionsByProjectAsync

        [Test]
        public async Task GetPermissionsByProjectAsync_ReturnsMappedDtos()
        {
            var permissions = new List<Permission>
            {
                new Permission { Id = 1, ProjectId = 10, Level = PermissionLevel.View },
                new Permission { Id = 2, ProjectId = 10, Level = PermissionLevel.Edit }
            };

            _permRepoMock.Setup(r => r.GetPermissionsByProjectAsync(10)).ReturnsAsync(permissions);
            _mapperMock.Setup(m => m.Map(It.IsAny<Permission>(), null!))
                       .Returns<Permission, IGenericService<Permission>>((p, _) => new PermissionDTO
                       {
                           Id = p.Id,
                           Level = p.Level.ToString()
                       });

            var result = await _service.GetPermissionsByProjectAsync(10);

            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Level, Is.EqualTo("View"));
        }

        [Test]
        public async Task GetPermissionsByProjectAsync_NoPermissions_ReturnsEmpty()
        {
            _permRepoMock.Setup(r => r.GetPermissionsByProjectAsync(5)).ReturnsAsync(new List<Permission>());
            var result = await _service.GetPermissionsByProjectAsync(5);
            Assert.That(result, Is.Empty);
        }

        #endregion

        #region InviteUserAsync

        [Test]
        public void InviteUserAsync_ProjectNotFound_Throws()
        {
            _projectRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Project?)null);
            var request = new CreatePermissionRequestDTO { ProjectId = 99, UserEmail = "test@test.com", Level = PermissionLevel.View };

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.InviteUserAsync(request, 1));
        }

        [Test]
        public void InviteUserAsync_NotOwner_ThrowsUnauthorized()
        {
            var project = new Project { Id = 10, OwnerId = 55 };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            var request = new CreatePermissionRequestDTO { ProjectId = 10, UserEmail = "test@test.com", Level = PermissionLevel.View };

            Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.InviteUserAsync(request, 1));
        }

        [Test]
        public void InviteUserAsync_AlreadyHasPermission_Throws()
        {
            var ownerId = 100;
            var project = new Project { Id = 10, OwnerId = ownerId };
            var invitedUser = new User { Id = 200, Email = "invited@test.com", Name = "Invited" };

            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("invited@test.com")).ReturnsAsync(invitedUser);
            _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(200, 10)).ReturnsAsync(new Permission { Id = 99 });

            var request = new CreatePermissionRequestDTO { ProjectId = 10, UserEmail = "invited@test.com", Level = PermissionLevel.Comment };

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.InviteUserAsync(request, ownerId));
        }

        [Test]
        public async Task InviteUserAsync_Success_AddsPermissionAndSendsNotification()
        {
            var ownerId = 100;
            var project = new Project { Id = 10, Name = "Demo", OwnerId = ownerId };
            var invitedUser = new User { Id = 200, Email = "invited@test.com", Name = "Invited" };

            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("invited@test.com")).ReturnsAsync(invitedUser);
            _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(200, 10)).ReturnsAsync((Permission?)null);
            _permRepoMock.Setup(r => r.AddAsync(It.IsAny<Permission>())).Returns(Task.CompletedTask);
            _permRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var createdPermission = new Permission { Id = 0, UserId = 200, ProjectId = 10, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending };
            _permRepoMock.Setup(r => r.GetByIdAsync(0)).ReturnsAsync(createdPermission);

            _mapperMock.Setup(m => m.Map(createdPermission, null!)).Returns(new PermissionDTO { Id = 0, Level = "Comment" });

            var request = new CreatePermissionRequestDTO { ProjectId = 10, UserEmail = "invited@test.com", Level = PermissionLevel.Comment };

            var result = await _service.InviteUserAsync(request, ownerId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Id, Is.EqualTo(0));   // <-- changed
            _permRepoMock.Verify(r => r.AddAsync(It.Is<Permission>(p => p.UserId == 200 && p.Level == PermissionLevel.Comment && p.Status == PermissionStatus.Pending)), Times.Once);
            _notifServiceMock.Verify(n => n.CreateNotificationAsync(200, NotificationType.Invitation, It.Is<string>(s => s.Contains("Demo")), "/invitations"), Times.Once);
        }

        #endregion

        #region AcceptInvitationAsync

        [Test]
        public void AcceptInvitationAsync_NotFound_Throws()
        {
            _permRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Permission?)null);
            Assert.ThrowsAsync<InvalidOperationException>(() => _service.AcceptInvitationAsync(1, 10));
        }

        [Test]
        public void AcceptInvitationAsync_NotYourInvitation_Throws()
        {
            var perm = new Permission { Id = 2, UserId = 99 };
            _permRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(perm);
            Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.AcceptInvitationAsync(2, 100));
        }

        [Test]
        public void AcceptInvitationAsync_AlreadyActive_Throws()
        {
            var perm = new Permission { Id = 3, UserId = 33, Status = PermissionStatus.Active };
            _permRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(perm);
            Assert.ThrowsAsync<InvalidOperationException>(() => _service.AcceptInvitationAsync(3, 33));
        }

        [Test]
        public async Task AcceptInvitationAsync_Success_SetsActiveAndReturnsDto()
        {
            var perm = new Permission { Id = 4, UserId = 44, Status = PermissionStatus.Pending, Level = PermissionLevel.Edit };
            _permRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(perm);
            _mapperMock.Setup(m => m.Map(perm, null!)).Returns(new PermissionDTO { Id = 4, Level = "Edit" });

            var result = await _service.AcceptInvitationAsync(4, 44);

            Assert.That(perm.Status, Is.EqualTo(PermissionStatus.Active));
            _permRepoMock.Verify(r => r.Update(perm), Times.Once);
            _permRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
            Assert.That(result.Id, Is.EqualTo(4));
        }

        #endregion

        #region GetPendingInvitationsForUserAsync

        [Test]
        public async Task GetPendingInvitations_ReturnsMappedList()
        {
            var perms = new List<Permission>
            {
                new Permission { Id = 10, ProjectId = 1, Project = new Project { Name = "P1" }, Level = PermissionLevel.View, Status = PermissionStatus.Pending },
                new Permission { Id = 11, ProjectId = 2, Project = null, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending }
            };
            _permRepoMock.Setup(r => r.GetPendingInvitationsForUserAsync(5)).ReturnsAsync(perms);

            var result = await _service.GetPendingInvitationsForUserAsync(5);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list[0].ProjectName, Is.EqualTo("P1"));
            Assert.That(list[1].ProjectName, Is.EqualTo("Unknown"));
        }

        [Test]
        public async Task GetPendingInvitations_Empty_ReturnsEmpty()
        {
            _permRepoMock.Setup(r => r.GetPendingInvitationsForUserAsync(5)).ReturnsAsync(new List<Permission>());
            var result = await _service.GetPendingInvitationsForUserAsync(5);
            Assert.That(result, Is.Empty);
        }

        #endregion

        #region RemovePermissionAsync

        [Test]
        public void RemovePermissionAsync_NotFound_Throws()
        {
            _permRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Permission?)null);
            Assert.ThrowsAsync<InvalidOperationException>(() => _service.RemovePermissionAsync(1, 1));
        }

        [Test]
        public void RemovePermissionAsync_ProjectNotFound_Throws()
        {
            var perm = new Permission { Id = 1, ProjectId = 999 };
            _permRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(perm);
            _projectRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Project?)null);

            Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RemovePermissionAsync(1, 1));
        }

        [Test]
        public void RemovePermissionAsync_NotOwner_Throws()
        {
            var perm = new Permission { Id = 2, ProjectId = 50 };
            var project = new Project { Id = 50, OwnerId = 77 };
            _permRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(perm);
            _projectRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(project);

            Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RemovePermissionAsync(2, 99));
        }

        [Test]
        public async Task RemovePermissionAsync_Owner_DeletesPermission()
        {
            var perm = new Permission { Id = 3, ProjectId = 60 };
            var project = new Project { Id = 60, OwnerId = 88 };
            _permRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(perm);
            _projectRepoMock.Setup(r => r.GetByIdAsync(60)).ReturnsAsync(project);
            _permRepoMock.Setup(r => r.DeleteByIdAsync(3)).ReturnsAsync(true);

            await _service.RemovePermissionAsync(3, 88);

            _permRepoMock.Verify(r => r.DeleteByIdAsync(3), Times.Once);
        }

        #endregion

        #region GetUserPermissionAsync

        [Test]
        public async Task GetUserPermissionAsync_Owner_ReturnsEdit()
        {
            var project = new Project { Id = 10, OwnerId = 42 };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);

            var result = await _service.GetUserPermissionAsync(42, 10);
            Assert.That(result, Is.EqualTo(PermissionLevel.Edit));
        }

        [Test]
        public async Task GetUserPermissionAsync_ActivePermission_ReturnsLevel()
        {
            var project = new Project { Id = 10, OwnerId = 1 };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(2, 10))
                         .ReturnsAsync(new Permission { Level = PermissionLevel.Comment, Status = PermissionStatus.Active });

            var result = await _service.GetUserPermissionAsync(2, 10);
            Assert.That(result, Is.EqualTo(PermissionLevel.Comment));
        }

        [Test]
        public async Task GetUserPermissionAsync_PendingPermission_ReturnsNull()
        {
            var project = new Project { Id = 10, OwnerId = 1 };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(3, 10))
                         .ReturnsAsync(new Permission { Level = PermissionLevel.View, Status = PermissionStatus.Pending });

            var result = await _service.GetUserPermissionAsync(3, 10);
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task GetUserPermissionAsync_NoPermissionAndNotOwner_ReturnsNull()
        {
            var project = new Project { Id = 10, OwnerId = 1 };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(99, 10)).ReturnsAsync((Permission?)null);

            var result = await _service.GetUserPermissionAsync(99, 10);
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task GetUserPermissionAsync_ProjectNotFound_ReturnsNull()
        {
            _projectRepoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Project?)null);
            var result = await _service.GetUserPermissionAsync(1, 404);
            Assert.That(result, Is.Null);
        }

        #endregion
    }
}