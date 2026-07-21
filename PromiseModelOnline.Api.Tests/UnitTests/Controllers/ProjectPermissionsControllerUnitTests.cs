using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

/// <summary>
/// Unit tests for <see cref="ProjectPermissionsController"/> covering permission management within a project scope.
/// Requirements: REQ_FUN_003 REQ_USE_012
/// </summary>
public class ProjectPermissionsControllerUnitTests
{
    private Mock<IPermissionService> _mockPermissionService = null!;
    private Mock<IUserRepository> _mockUserRepository = null!;
    private Mock<ILogger<ProjectPermissionsController>> _mockLogger = null!;
    private Mock<IProjectService> _mockProjectService = null!;
    private ProjectPermissionsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _mockPermissionService = new Mock<IPermissionService>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockLogger = new Mock<ILogger<ProjectPermissionsController>>();
        _mockProjectService = new Mock<IProjectService>();
        _controller = new ProjectPermissionsController(
            _mockPermissionService.Object,
            _mockUserRepository.Object,
            _mockLogger.Object,
            _mockProjectService.Object);
    }

    #region GetPermissions Tests

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Valid project resolves successfully and returns Ok with permissions list")]
    public async Task GetPermissions_WithValidProject_ReturnsOk()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1, Name = "Test Project" };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var permissions = new List<PermissionDto>
            {
                new PermissionDto { Id = 1, Level = "View" }
            };
        _mockPermissionService.Setup(s => s.GetPermissionsByProjectAsync(projectEntity.Id))
            .ReturnsAsync(permissions);

        ControllerTestHelpers.SetControllerUser(_controller, "admin@example.com");
        var permUser = new User { Id = 1, Email = "admin@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("admin@example.com", It.IsAny<string?>())).ReturnsAsync(permUser);
        var permServices = new Mock<IServiceProvider>();
        permServices.Setup(s => s.GetService(typeof(IPermissionService))).Returns(_mockPermissionService.Object);
        permServices.Setup(s => s.GetService(typeof(IUserRepository))).Returns(_mockUserRepository.Object);
        _controller.ControllerContext.HttpContext.RequestServices = permServices.Object;
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(permUser.Id, projectEntity.Id)).ReturnsAsync(PermissionLevel.Edit);

        // Act
        var result = await _controller.GetPermissions(owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as IEnumerable<PermissionDto>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data, Is.EquivalentTo(permissions));
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Missing project slug returns NotFound")]
    public async Task GetPermissions_WithMissingProject_ReturnsNotFound()
    {
        // Arrange
        var owner = "missingowner";
        var project = "missingproject";
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync((Project?)null);

        // Act
        var result = await _controller.GetPermissions(owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    #endregion

    #region InviteUser Tests

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Valid invite request creates permission and logs success")]
    public async Task InviteUser_WithValidRequest_ReturnsCreated()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var email = "user@example.com";
        var username = "testuser";
        ControllerTestHelpers.SetControllerUser(_controller, email, username);

        var user = new User { Id = 10, Email = email, Name = username };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync(email, username))
            .ReturnsAsync(user);

        var inviteServices = new Mock<IServiceProvider>();
        inviteServices.Setup(s => s.GetService(typeof(IPermissionService))).Returns(_mockPermissionService.Object);
        inviteServices.Setup(s => s.GetService(typeof(IUserRepository))).Returns(_mockUserRepository.Object);
        _controller.ControllerContext.HttpContext.RequestServices = inviteServices.Object;
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, projectEntity.Id)).ReturnsAsync(PermissionLevel.Edit);

        var request = new CreatePermissionRequestDto { Email = "invited@example.com", Level = PermissionLevel.View };
        var permissionDto = new PermissionDto { Id = 5, Level = "View" };
        _mockPermissionService.Setup(s => s.InviteUserAsync(projectEntity.Id, request.Email, request.Level, user.Id))
            .ReturnsAsync(permissionDto);

        // Act
        var result = await _controller.InviteUser(request, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = result.Result as CreatedAtActionResult;
        Assert.That(created, Is.Not.Null);
        Assert.That(created!.Value, Is.EqualTo(permissionDto));
        _mockLogger.VerifyLog(LogLevel.Information, "created Permission invitation");
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Service exception during invite returns BadRequest with error log")]
    public async Task InviteUser_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var email = "user@example.com";
        var username = "testuser";
        ControllerTestHelpers.SetControllerUser(_controller, email, username);

        var user = new User { Id = 10, Email = email, Name = username };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync(email, username))
            .ReturnsAsync(user);

        var inviteServices = new Mock<IServiceProvider>();
        inviteServices.Setup(s => s.GetService(typeof(IPermissionService))).Returns(_mockPermissionService.Object);
        inviteServices.Setup(s => s.GetService(typeof(IUserRepository))).Returns(_mockUserRepository.Object);
        _controller.ControllerContext.HttpContext.RequestServices = inviteServices.Object;
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, projectEntity.Id)).ReturnsAsync(PermissionLevel.Edit);

        var request = new CreatePermissionRequestDto { Email = "invited@example.com", Level = PermissionLevel.View };
        _mockPermissionService.Setup(s => s.InviteUserAsync(projectEntity.Id, request.Email, request.Level, user.Id))
            .ThrowsAsync(new InvalidOperationException("Invitation failed"));

        // Act
        var result = await _controller.InviteUser(request, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("The invitation could not be sent."));
        _mockLogger.VerifyLog(LogLevel.Error, "InviteUser failed");
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Missing project slug during invite returns NotFound before auth check")]
    public async Task InviteUser_WithMissingProject_ReturnsNotFound()
    {
        // Arrange
        var owner = "missingowner";
        var project = "missingproject";
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync((Project?)null);

        var request = new CreatePermissionRequestDto { Email = "invited@example.com", Level = PermissionLevel.View };

        // Act
        var result = await _controller.InviteUser(request, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Missing email claim on user returns Forbidden")]
    public async Task InviteUser_WithoutAuth_ReturnsForbidden()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        ControllerTestHelpers.SetControllerUser(_controller, null);

        var authServices = new Mock<IServiceProvider>();
        authServices.Setup(s => s.GetService(typeof(IPermissionService))).Returns(_mockPermissionService.Object);
        authServices.Setup(s => s.GetService(typeof(IUserRepository))).Returns(_mockUserRepository.Object);
        _controller.ControllerContext.HttpContext.RequestServices = authServices.Object;

        var request = new CreatePermissionRequestDto { Email = "invited@example.com", Level = PermissionLevel.View };

        // Act
        var result = await _controller.InviteUser(request, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    #endregion

    #region RevokePermission Tests

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Valid revoke request removes permission and returns NoContent")]
    public async Task RevokePermission_ValidRequest_ReturnsNoContent()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var email = "user@example.com";
        var username = "testuser";
        ControllerTestHelpers.SetControllerUser(_controller, email, username);

        var user = new User { Id = 10, Email = email, Name = username };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync(email, username))
            .ReturnsAsync(user);

        var revokeServices = new Mock<IServiceProvider>();
        revokeServices.Setup(s => s.GetService(typeof(IPermissionService))).Returns(_mockPermissionService.Object);
        revokeServices.Setup(s => s.GetService(typeof(IUserRepository))).Returns(_mockUserRepository.Object);
        _controller.ControllerContext.HttpContext.RequestServices = revokeServices.Object;
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, projectEntity.Id)).ReturnsAsync(PermissionLevel.Edit);

        var permissionId = 5;

        // Act
        var result = await _controller.RevokePermission(permissionId, owner, project);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _mockPermissionService.Verify(s => s.RemovePermissionAsync(permissionId, user.Id), Times.Once);
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Service exception during revoke returns BadRequest with error log")]
    public async Task RevokePermission_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var email = "user@example.com";
        var username = "testuser";
        ControllerTestHelpers.SetControllerUser(_controller, email, username);

        var user = new User { Id = 10, Email = email, Name = username };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync(email, username))
            .ReturnsAsync(user);

        var revokeServices = new Mock<IServiceProvider>();
        revokeServices.Setup(s => s.GetService(typeof(IPermissionService))).Returns(_mockPermissionService.Object);
        revokeServices.Setup(s => s.GetService(typeof(IUserRepository))).Returns(_mockUserRepository.Object);
        _controller.ControllerContext.HttpContext.RequestServices = revokeServices.Object;
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, projectEntity.Id)).ReturnsAsync(PermissionLevel.Edit);

        var permissionId = 5;
        _mockPermissionService.Setup(s => s.RemovePermissionAsync(permissionId, user.Id))
            .ThrowsAsync(new InvalidOperationException("Revoke failed"));

        // Act
        var result = await _controller.RevokePermission(permissionId, owner, project);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("The permission could not be revoked."));
        _mockLogger.VerifyLog(LogLevel.Error, "RevokePermission failed");
    }

    #endregion

    #region GetMyPermission Tests

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Authenticated user with permission returns Ok with level string")]
    public async Task GetMyPermission_WithPermission_ReturnsOk()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var email = "user@example.com";
        ControllerTestHelpers.SetControllerUser(_controller, email);

        var user = new User { Id = 10, Email = email };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync(email))
            .ReturnsAsync(user);

        var permissionId = 5;
        _mockPermissionService.Setup(s => s.GetUserPermissionAsync(user.Id, projectEntity.Id))
            .ReturnsAsync(PermissionLevel.View);

        // Act
        var result = await _controller.GetMyPermission(permissionId, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        Assert.That(ok!.Value, Is.EqualTo("View"));
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Missing email claim returns Unauthorized")]
    public async Task GetMyPermission_WithoutEmail_ReturnsUnauthorized()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        ControllerTestHelpers.SetControllerUser(_controller, null);

        var permissionId = 5;

        // Act
        var result = await _controller.GetMyPermission(permissionId, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Authenticated user with no permission returns NoContent")]
    public async Task GetMyPermission_WhenNoPermission_ReturnsNoContent()
    {
        // Arrange
        var owner = "testowner";
        var project = "testproject";
        var projectEntity = new Project { Id = 1 };
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync(projectEntity);

        var email = "user@example.com";
        ControllerTestHelpers.SetControllerUser(_controller, email);

        var user = new User { Id = 10, Email = email };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync(email))
            .ReturnsAsync(user);

        var permissionId = 5;
        _mockPermissionService.Setup(s => s.GetUserPermissionAsync(user.Id, projectEntity.Id))
            .ReturnsAsync((PermissionLevel?)null);

        // Act
        var result = await _controller.GetMyPermission(permissionId, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Missing project slug returns NotFound")]
    public async Task GetMyPermission_WithMissingProject_ReturnsNotFound()
    {
        // Arrange
        var owner = "missingowner";
        var project = "missingproject";
        _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(owner, project))
            .ReturnsAsync((Project?)null);

        var permissionId = 5;

        // Act
        var result = await _controller.GetMyPermission(permissionId, owner, project);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    #endregion
}
