using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Services;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
// Requirements: REQ_FUN_013 REQ_FUN_014 REQ_FUN_015 REQ_FUN_016
/// <summary>Unit tests for <see cref="PermissionService"/> covering invitations, acceptance, and access control.</summary>
public class PermissionServiceUnitTests
{
    private Mock<IPermissionRepository> _permRepoMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private Mock<IGenericRepository<Project>> _projectRepoMock = null!;
    private Mock<IGenericMapper<Permission, PermissionDto>> _mapperMock = null!;
    private Mock<INotificationService> _notifServiceMock = null!;
    private Mock<ILogger<PermissionService>> _loggerMock = null!;
    private Mock<IAuthUserLookupService> _authLookupMock = null!;
    private Mock<IInvitationEmailService> _invitationEmailMock = null!;
    private PermissionService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _permRepoMock = new Mock<IPermissionRepository>();
        _userRepoMock = new Mock<IUserRepository>();
        _projectRepoMock = new Mock<IGenericRepository<Project>>();
        _mapperMock = new Mock<IGenericMapper<Permission, PermissionDto>>();
        _notifServiceMock = new Mock<INotificationService>();
        _loggerMock = new Mock<ILogger<PermissionService>>();
        _authLookupMock = new Mock<IAuthUserLookupService>();
        _invitationEmailMock = new Mock<IInvitationEmailService>();

        _service = new PermissionService(
            _permRepoMock.Object,
            _userRepoMock.Object,
            _projectRepoMock.Object,
            _mapperMock.Object,
            _notifServiceMock.Object,
            _loggerMock.Object,
            _authLookupMock.Object,
            _invitationEmailMock.Object);
    }

    #region GetPermissionsByProjectAsync

    [Test]
    public async Task REQ_FUN_013_GetPermissionsByProjectAsync_ReturnsMappedDtos()
    {
        // Arrange
        var permissions = new List<Permission>
            {
                new Permission { Id = 1, ProjectId = 10, Level = PermissionLevel.View },
                new Permission { Id = 2, ProjectId = 10, Level = PermissionLevel.Edit }
            };
        _permRepoMock.Setup(r => r.GetPermissionsByProjectAsync(10)).ReturnsAsync(permissions);
        _mapperMock.Setup(m => m.Map(It.IsAny<Permission>(), null!))
                   .Returns<Permission, IGenericService<Permission>>((p, _) => new PermissionDto
                   {
                       Id = p.Id,
                       Level = p.Level.ToString()
                   });

        // Act
        var result = await _service.GetPermissionsByProjectAsync(10);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(2));
        Assert.That(result.First().Level, Is.EqualTo("View"));
    }

    [Test]
    public async Task REQ_FUN_013_GetPermissionsByProjectAsync_NoPermissions_ReturnsEmpty()
    {
        // Arrange
        _permRepoMock.Setup(r => r.GetPermissionsByProjectAsync(5)).ReturnsAsync(new List<Permission>());

        // Act
        var result = await _service.GetPermissionsByProjectAsync(5);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region InviteUserAsync

    [Test]
    public void REQ_FUN_013_InviteUserAsync_ProjectNotFound_Throws()
    {
        // Arrange
        _projectRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Project?)null);
        var request = new CreatePermissionRequestDto { Email = "test@test.com", Level = PermissionLevel.View };

        // Act & Assert
        // Assert
        Assert.ThrowsAsync<InvalidOperationException>(() => _service.InviteUserAsync(99, request.Email, request.Level, 1));
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public void REQ_FUN_013_InviteUserAsync_NotOwner_ThrowsUnauthorized()
    {
        // Arrange
        var project = new Project { Id = 10, OwnerId = 55 };
        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        var request = new CreatePermissionRequestDto { Email = "test@test.com", Level = PermissionLevel.View };

        // Act & Assert
        // Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.InviteUserAsync(10, request.Email, request.Level, 1));
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public void REQ_FUN_013_InviteUserAsync_AlreadyHasPermission_Throws()
    {
        // Arrange
        var ownerId = 100;
        var project = new Project { Id = 10, OwnerId = ownerId };
        var invitedUser = new User { Id = 200, Email = "invited@test.com", Name = "Invited" };

        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _userRepoMock.Setup(r => r.FindByEmailAsync("invited@test.com")).ReturnsAsync(new[] { invitedUser });
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(200, 10)).ReturnsAsync(new Permission { Id = 99 });

        // Act
        var request = new CreatePermissionRequestDto { Email = "invited@test.com", Level = PermissionLevel.Comment };

        // Assert
        Assert.ThrowsAsync<InvalidOperationException>(() => _service.InviteUserAsync(10, request.Email, request.Level, ownerId));
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_013_InviteUserAsync_Success_AddsPermissionAndSendsNotification()
    {
        // Arrange
        var ownerId = 100;
        var project = new Project { Id = 10, Name = "Demo", OwnerId = ownerId };
        var invitedUser = new User { Id = 200, Email = "invited@test.com", Name = "Invited" };

        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _userRepoMock.Setup(r => r.FindByEmailAsync("invited@test.com")).ReturnsAsync(new[] { invitedUser });
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(200, 10)).ReturnsAsync((Permission?)null);
        _permRepoMock.Setup(r => r.AddAsync(It.IsAny<Permission>())).Returns(Task.CompletedTask);
        _permRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        var createdPermission = new Permission { Id = 0, UserId = 200, ProjectId = 10, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending };
        _permRepoMock.Setup(r => r.GetByIdAsync(0)).ReturnsAsync(createdPermission);

        _mapperMock.Setup(m => m.Map(createdPermission, null!)).Returns(new PermissionDto { Id = 0, Level = "Comment" });

        var request = new CreatePermissionRequestDto { Email = "invited@test.com", Level = PermissionLevel.Comment };

        // Act
        var result = await _service.InviteUserAsync(10, request.Email, request.Level, ownerId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(0));
        _permRepoMock.Verify(r => r.AddAsync(It.Is<Permission>(p => p.UserId == 200 && p.Level == PermissionLevel.Comment && p.Status == PermissionStatus.Pending)), Times.Once);
        _notifServiceMock.Verify(n => n.CreateNotificationAsync(200, NotificationType.Invitation, It.Is<string>(s => s.Contains("Demo")), "/invitations"), Times.Once);
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync("invited@test.com", It.IsAny<string>(), "Demo"), Times.Once);
    }

    [Test]
    public void REQ_FUN_013_InviteUserAsync_UserNotFoundByEmailOrName_Throws()
    {
        // Arrange
        var ownerId = 100;
        var project = new Project { Id = 10, OwnerId = ownerId };

        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _userRepoMock.Setup(r => r.FindByEmailAsync("nonexistent")).ReturnsAsync(Enumerable.Empty<User>());
        _userRepoMock.Setup(r => r.GetUsersByNameAsync("nonexistent")).ReturnsAsync(Enumerable.Empty<User>());
        _userRepoMock.Setup(r => r.GetBySlugAsync("nonexistent")).ReturnsAsync((User?)null);
        _userRepoMock.Setup(r => r.SearchUsersAsync("nonexistent", 1)).ReturnsAsync(Enumerable.Empty<User>());
        _authLookupMock.Setup(l => l.FindByUsernameOrEmailAsync("nonexistent")).ReturnsAsync((AuthUserInfo?)null);

        // Act
        var request = new CreatePermissionRequestDto { Email = "nonexistent", Level = PermissionLevel.View };

        // Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(() => _service.InviteUserAsync(10, request.Email, request.Level, ownerId));
        Assert.That(ex.Message, Does.Contain("not found"));
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_013_InviteUserAsync_Success_WhenFoundViaAuthLookup()
    {
        // Arrange
        var ownerId = 100;
        var project = new Project { Id = 10, Name = "Demo", OwnerId = ownerId };
        var authUser = new AuthUserInfo { UserName = "jon", Email = "leafpad@protonmail.com" };
        var invitedUser = new User { Id = 300, Email = authUser.Email, Name = authUser.UserName };

        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _userRepoMock.Setup(r => r.FindByEmailAsync("jon")).ReturnsAsync(Enumerable.Empty<User>());
        _userRepoMock.Setup(r => r.GetUsersByNameAsync("jon")).ReturnsAsync(Enumerable.Empty<User>());
        _userRepoMock.Setup(r => r.GetBySlugAsync("jon")).ReturnsAsync((User?)null);
        _userRepoMock.Setup(r => r.SearchUsersAsync("jon", 1)).ReturnsAsync(Enumerable.Empty<User>());
        _authLookupMock.Setup(l => l.FindByUsernameOrEmailAsync("jon")).ReturnsAsync(authUser);
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync(authUser.Email, authUser.UserName)).ReturnsAsync(invitedUser);
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(300, 10)).ReturnsAsync((Permission?)null);
        _permRepoMock.Setup(r => r.AddAsync(It.IsAny<Permission>())).Returns(Task.CompletedTask);
        _permRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        var createdPermission = new Permission { Id = 0, UserId = 300, ProjectId = 10, Level = PermissionLevel.View, Status = PermissionStatus.Pending };
        _permRepoMock.Setup(r => r.GetByIdAsync(0)).ReturnsAsync(createdPermission);
        _mapperMock.Setup(m => m.Map(createdPermission, null!)).Returns(new PermissionDto { Id = 0, Level = "View" });

        var request = new CreatePermissionRequestDto { Email = "jon", Level = PermissionLevel.View };

        // Act
        var result = await _service.InviteUserAsync(10, request.Email, request.Level, ownerId);

        // Assert
        Assert.That(result, Is.Not.Null);
        _authLookupMock.Verify(l => l.FindByUsernameOrEmailAsync("jon"), Times.Once);
        _userRepoMock.Verify(r => r.GetOrCreateUserByEmailAsync(authUser.Email, authUser.UserName), Times.Once);
        _permRepoMock.Verify(r => r.AddAsync(It.Is<Permission>(p => p.UserId == 300)), Times.Once);
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync("leafpad@protonmail.com", It.IsAny<string>(), "Demo"), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_013_InviteUserAsync_Success_WhenFoundByName()
    {
        // Arrange
        var ownerId = 100;
        var project = new Project { Id = 10, Name = "Demo", OwnerId = ownerId };
        var invitedUser = new User { Id = 300, Email = "found@test.com", Name = "someuser" };

        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _userRepoMock.Setup(r => r.FindByEmailAsync("someuser")).ReturnsAsync(Enumerable.Empty<User>());
        _userRepoMock.Setup(r => r.GetUsersByNameAsync("someuser")).ReturnsAsync(new[] { invitedUser });
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(300, 10)).ReturnsAsync((Permission?)null);
        _permRepoMock.Setup(r => r.AddAsync(It.IsAny<Permission>())).Returns(Task.CompletedTask);
        _permRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        var createdPermission = new Permission { Id = 0, UserId = 300, ProjectId = 10, Level = PermissionLevel.Edit, Status = PermissionStatus.Pending };
        _permRepoMock.Setup(r => r.GetByIdAsync(0)).ReturnsAsync(createdPermission);

        _mapperMock.Setup(m => m.Map(createdPermission, null!)).Returns(new PermissionDto { Id = 0, Level = "Edit" });

        var request = new CreatePermissionRequestDto { Email = "someuser", Level = PermissionLevel.Edit };

        // Act
        var result = await _service.InviteUserAsync(10, request.Email, request.Level, ownerId);

        // Assert
        Assert.That(result, Is.Not.Null);
        _permRepoMock.Verify(r => r.AddAsync(It.Is<Permission>(p => p.UserId == 300 && p.Level == PermissionLevel.Edit && p.Status == PermissionStatus.Pending)), Times.Once);
        _notifServiceMock.Verify(n => n.CreateNotificationAsync(300, NotificationType.Invitation, It.Is<string>(s => s.Contains("Demo")), "/invitations"), Times.Once);
        _invitationEmailMock.Verify(e => e.SendInvitationEmailAsync("found@test.com", It.IsAny<string>(), "Demo"), Times.Once);
    }

    #endregion

    #region AcceptInvitationAsync

    [Test]
    public void REQ_FUN_013_AcceptInvitationAsync_NotFound_Throws()
    {
        // Arrange
        _permRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Permission?)null);
        // Assert
        Assert.ThrowsAsync<InvalidOperationException>(() => _service.AcceptInvitationAsync(1, 10));
    }

    [Test]
    public void REQ_FUN_013_AcceptInvitationAsync_NotYourInvitation_Throws()
    {
        // Arrange
        var perm = new Permission { Id = 2, UserId = 99 };
        _permRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(perm);
        // Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.AcceptInvitationAsync(2, 100));
    }

    [Test]
    public void REQ_FUN_013_AcceptInvitationAsync_AlreadyActive_Throws()
    {
        // Arrange
        var perm = new Permission { Id = 3, UserId = 33, Status = PermissionStatus.Active };
        _permRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(perm);
        // Assert
        Assert.ThrowsAsync<InvalidOperationException>(() => _service.AcceptInvitationAsync(3, 33));
    }

    [Test]
    public async Task REQ_FUN_013_AcceptInvitationAsync_Success_SetsActiveAndReturnsDto()
    {
        // Arrange
        var perm = new Permission { Id = 4, UserId = 44, Status = PermissionStatus.Pending, Level = PermissionLevel.Edit };
        _permRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(perm);
        _mapperMock.Setup(m => m.Map(perm, null!)).Returns(new PermissionDto { Id = 4, Level = "Edit" });

        // Act
        var result = await _service.AcceptInvitationAsync(4, 44);

        // Assert
        Assert.That(perm.Status, Is.EqualTo(PermissionStatus.Active));
        _permRepoMock.Verify(r => r.Update(perm), Times.Once);
        _permRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        Assert.That(result.Id, Is.EqualTo(4));
    }

    #endregion

    #region GetPendingInvitationsForUserAsync

    [Test]
    public async Task REQ_FUN_013_GetPendingInvitations_ReturnsMappedList()
    {
        // Arrange
        var perms = new List<Permission>
            {
                new Permission { Id = 10, ProjectId = 1, Project = new Project { Name = "P1" }, Level = PermissionLevel.View, Status = PermissionStatus.Pending },
                new Permission { Id = 11, ProjectId = 2, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending }
            };
        _permRepoMock.Setup(r => r.GetPendingInvitationsForUserAsync(5)).ReturnsAsync(perms);

        // Act
        var result = await _service.GetPendingInvitationsForUserAsync(5);
        var list = result.ToList();

        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list[0].ProjectName, Is.EqualTo("P1"));
        Assert.That(list[1].ProjectName, Is.EqualTo("Unknown"));
    }

    [Test]
    public async Task REQ_FUN_013_GetPendingInvitations_Empty_ReturnsEmpty()
    {
        // Arrange
        _permRepoMock.Setup(r => r.GetPendingInvitationsForUserAsync(5)).ReturnsAsync(new List<Permission>());
        // Act
        var result = await _service.GetPendingInvitationsForUserAsync(5);
        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region RemovePermissionAsync

    [Test]
    public void REQ_FUN_013_RemovePermissionAsync_NotFound_Throws()
    {
        // Arrange
        _permRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Permission?)null);
        // Assert
        Assert.ThrowsAsync<InvalidOperationException>(() => _service.RemovePermissionAsync(1, 1));
    }

    [Test]
    public void REQ_FUN_013_RemovePermissionAsync_ProjectNotFound_Throws()
    {
        // Arrange
        var perm = new Permission { Id = 1, ProjectId = 999 };
        _permRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(perm);
        _projectRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Project?)null);

        // Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RemovePermissionAsync(1, 1));
    }

    [Test]
    public void REQ_FUN_013_RemovePermissionAsync_NotOwner_Throws()
    {
        // Arrange
        var perm = new Permission { Id = 2, ProjectId = 50 };
        // Act
        var project = new Project { Id = 50, OwnerId = 77 };
        _permRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(perm);
        _projectRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(project);

        // Assert
        Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RemovePermissionAsync(2, 99));
    }

    [Test]
    public async Task REQ_FUN_013_RemovePermissionAsync_Owner_DeletesPermission()
    {
        // Arrange
        var perm = new Permission { Id = 3, ProjectId = 60 };
        var project = new Project { Id = 60, OwnerId = 88 };
        _permRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(perm);
        _projectRepoMock.Setup(r => r.GetByIdAsync(60)).ReturnsAsync(project);
        _permRepoMock.Setup(r => r.DeleteByIdAsync(3)).ReturnsAsync(true);

        // Act
        await _service.RemovePermissionAsync(3, 88);

        // Assert
        _permRepoMock.Verify(r => r.DeleteByIdAsync(3), Times.Once);
    }

    #endregion

    #region GetUserPermissionAsync

    [Test]
    public async Task REQ_FUN_013_GetUserPermissionAsync_Owner_ReturnsEdit()
    {
        // Arrange
        var project = new Project { Id = 10, OwnerId = 42 };
        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);

        // Act
        var result = await _service.GetUserPermissionAsync(42, 10);
        // Assert
        Assert.That(result, Is.EqualTo(PermissionLevel.Edit));
    }

    [Test]
    public async Task REQ_FUN_013_GetUserPermissionAsync_ActivePermission_ReturnsLevel()
    {
        // Arrange
        var project = new Project { Id = 10, OwnerId = 1 };
        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(2, 10))
                     .ReturnsAsync(new Permission { Level = PermissionLevel.Comment, Status = PermissionStatus.Active });

        // Act
        var result = await _service.GetUserPermissionAsync(2, 10);
        // Assert
        Assert.That(result, Is.EqualTo(PermissionLevel.Comment));
    }

    [Test]
    public async Task REQ_FUN_013_GetUserPermissionAsync_PendingPermission_ReturnsNull()
    {
        // Arrange
        var project = new Project { Id = 10, OwnerId = 1 };
        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(3, 10))
                     .ReturnsAsync(new Permission { Level = PermissionLevel.View, Status = PermissionStatus.Pending });

        // Act
        var result = await _service.GetUserPermissionAsync(3, 10);
        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_013_GetUserPermissionAsync_NoPermissionAndNotOwner_ReturnsNull()
    {
        // Arrange
        var project = new Project { Id = 10, OwnerId = 1 };
        _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
        _permRepoMock.Setup(r => r.GetByUserAndProjectAsync(99, 10)).ReturnsAsync((Permission?)null);

        // Act
        var result = await _service.GetUserPermissionAsync(99, 10);
        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_013_GetUserPermissionAsync_ProjectNotFound_ReturnsNull()
    {
        // Arrange
        _projectRepoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Project?)null);
        // Act
        var result = await _service.GetUserPermissionAsync(1, 404);
        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion
}
