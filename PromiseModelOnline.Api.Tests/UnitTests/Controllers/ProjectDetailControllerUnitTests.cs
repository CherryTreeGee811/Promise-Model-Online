using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

/// <summary>Unit tests for <see cref="ProjectDetailController"/> covering project operations.</summary>
// Requirements: REQ_FUN_003 REQ_FUN_011
public class ProjectDetailControllerTests
{
    private Mock<IProjectService> _mockProjectService = null!;
    private Mock<IUserRepository> _mockUserRepo = null!;
    private Mock<IPermissionService> _mockPermissionService = null!;
    private Mock<IGenericService<Promise>> _mockPromiseService = null!;
    private Mock<IGenericMapper<Project, ProjectDto>> _mockMapper = null!;
    private Mock<IGenericMapper<Promise, PromiseDto>> _mockPromiseMapper = null!;
    private Mock<IGenericService<Project>> _mockGenericService = null!;
    private Mock<IProjectExportService> _mockExportService = null!;
    private Mock<IPromiseModelOnlineContext> _mockContext = null!;
    private Mock<ILogger<ProjectDetailController>> _mockLogger = null!;
    private ProjectDetailController _controller = null!;
    private const string OwnerSlug = "testowner";
    private const string ProjectSlug = "test-project";

    [SetUp]
    public void SetUp()
    {
        _mockProjectService = new Mock<IProjectService>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockPermissionService = new Mock<IPermissionService>();
        _mockPromiseService = new Mock<IGenericService<Promise>>();
        _mockMapper = new Mock<IGenericMapper<Project, ProjectDto>>();
        _mockPromiseMapper = new Mock<IGenericMapper<Promise, PromiseDto>>();
        _mockGenericService = new Mock<IGenericService<Project>>();
        _mockExportService = new Mock<IProjectExportService>();
        _mockContext = new Mock<IPromiseModelOnlineContext>();
        _mockLogger = new Mock<ILogger<ProjectDetailController>>();
        _controller = new ProjectDetailController(
            _mockProjectService.Object,
            _mockUserRepo.Object,
            _mockPermissionService.Object,
            _mockPromiseService.Object,
            _mockMapper.Object,
            _mockPromiseMapper.Object,
            _mockGenericService.Object,
            _mockExportService.Object,
            _mockContext.Object,
            _mockLogger.Object);
    }

    private void SetUpProjectResolve(Project? project) => _mockProjectService.Setup(s => s.GetByOwnerAndSlugAsync(OwnerSlug, ProjectSlug))
            .ReturnsAsync(project);

    private void SetControllerUser(string? email, string? nameid = null) => ControllerTestHelpers.SetControllerUser(_controller, email, nameid);

    [Test]
    public async Task REQ_FUN_003_GetBySlug_WhenExists_ReturnsOkDto()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 7, Name = "P7", Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 1, Email = "u@u.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("u@u.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockProjectService.Setup(s => s.GetAccessibleProjectsAsync(user.Id)).ReturnsAsync(new List<Project> { project });

        _mockMapper.Setup(m => m.Map(project, It.IsAny<IGenericService<Project>>()))
                   .Returns(new ProjectDto { Id = 7, Name = "P7", Slug = ProjectSlug, OwnerSlug = OwnerSlug });

        SetControllerUser("u@u.com");
        // Act
        var result = await _controller.GetBySlug(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        var dto = ok!.Value as ProjectDto;
        Assert.That(dto, Is.Not.Null);
        Assert.That(dto!.Id, Is.EqualTo(7));
    }

    [Test]
    public async Task REQ_FUN_003_GetBySlug_WhenProjectNotFound_ReturnsNotFound()
    {
        // Arrange
        SetUpProjectResolve(null);
        SetControllerUser("u@u.com");
        // Act
        var result = await _controller.GetBySlug(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_003_GetMembers_WithAuthenticatedUser_ReturnsOkMembers()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 99, Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 2, Email = "x@y.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("x@y.com", It.IsAny<string?>())).ReturnsAsync(user);

        var members = new List<ProjectMemberDto> { new ProjectMemberDto { UserId = 5, Email = "m1@e" } };
        _mockProjectService.Setup(s => s.GetProjectMembersAsync(99)).ReturnsAsync(members);

        SetControllerUser("x@y.com");
        // Act
        var actionResult = await _controller.GetMembers(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(actionResult.Result, Is.InstanceOf<OkObjectResult>());
        var ok = actionResult.Result as OkObjectResult;
        var returned = ok!.Value as List<ProjectMemberDto>;
        Assert.That(returned, Is.Not.Null);
        Assert.That(returned!.Count, Is.EqualTo(1));
        Assert.That(returned[0].UserId, Is.EqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_003_GetMembers_WhenProjectNotFound_ReturnsNotFound()
    {
        // Arrange
        SetUpProjectResolve(null);
        SetControllerUser("x@y.com");
        // Act
        var result = await _controller.GetMembers(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_003_GetMembers_MissingEmail_ReturnsOkResult()
    {
        // Arrange - email is null but user is still authenticated with projects.read scope
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        SetUpProjectResolve(new Project { Id = 1, Slug = ProjectSlug, Owner = owner });
        SetControllerUser(null);
        // Act
        var result = await _controller.GetMembers(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_003_UpdateDetails_WithNullRequest_ReturnsBadRequest()
    {
        // Arrange
        SetControllerUser("u@u.com");
        // Act
        var result = await _controller.UpdateDetails(OwnerSlug, ProjectSlug, null!);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_003_UpdateDetails_WithEmptyName_ReturnsBadRequest()
    {
        // Arrange
        SetControllerUser("u@u.com");
        var request = new UpdateProjectDetailsRequestDto { Name = "", Description = "" };
        // Act
        var result = await _controller.UpdateDetails(OwnerSlug, ProjectSlug, request);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_003_UpdateDetails_WhenProjectNotFound_ReturnsNotFound()
    {
        // Arrange
        SetUpProjectResolve(null);
        SetControllerUser("u@u.com");
        var request = new UpdateProjectDetailsRequestDto { Name = "Updated", Description = "" };
        // Act
        var result = await _controller.UpdateDetails(OwnerSlug, ProjectSlug, request);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_003_UpdateDetails_WithValidData_ReturnsOk()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 31, Name = "Old", Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        _mockMapper.Setup(m => m.Map(project, It.IsAny<IGenericService<Project>>()))
                   .Returns<Project, IGenericService<Project>>((p, svc) => new ProjectDto { Id = p.Id, Name = p.Name, Slug = p.Slug, OwnerSlug = p.Owner?.Slug ?? "" });

        SetControllerUser("u@u.com");
        var request = new UpdateProjectDetailsRequestDto { Name = "Updated", Description = "New desc" };
        // Act
        var result = await _controller.UpdateDetails(OwnerSlug, ProjectSlug, request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        Assert.That(project.Name, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task REQ_FUN_003_Export_WithAccessibleProject_ReturnsJsonFile()
    {
        // Arrange
        var owner = new User { Id = 77, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 55, Name = "Export me", Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 77, Email = "exporter@x.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("exporter@x.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockProjectService.Setup(s => s.GetAccessibleProjectsAsync(user.Id)).ReturnsAsync(new List<Project> { project });

        _mockExportService.Setup(s => s.BuildExportAsync(55)).ReturnsAsync(new ProjectExportDocument
        {
            SchemaVersion = "1.0",
            Project = new ProjectExportProject { Id = 55, Name = "Export me" }
        });

        SetControllerUser("exporter@x.com");
        // Act
        var result = await _controller.Export(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result, Is.InstanceOf<FileContentResult>());
        var file = result as FileContentResult;
        Assert.That(file, Is.Not.Null);
        Assert.That(file!.ContentType, Is.EqualTo("application/json"));
        Assert.That(file.FileDownloadName, Is.EqualTo($"{ProjectSlug}-export.json"));

        var json = Encoding.UTF8.GetString(file.FileContents);
        Assert.That(json, Does.Contain("schemaVersion"));
        Assert.That(json, Does.Contain("Export me"));
    }

    [Test]
    public async Task REQ_FUN_003_Export_MissingEmail_ReturnsUnauthorized()
    {
        // Arrange
        var owner = new User { Id = 77, Slug = OwnerSlug, Email = "o@x.com" };
        SetUpProjectResolve(new Project { Id = 55, Slug = ProjectSlug, Owner = owner });
        SetControllerUser(null);
        // Act
        var result = await _controller.Export(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_FUN_003_Export_WithoutAccess_ReturnsForbid()
    {
        // Arrange
        var owner = new User { Id = 88, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 99, Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 88, Email = "noaccess@x.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("noaccess@x.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockProjectService.Setup(s => s.GetAccessibleProjectsAsync(user.Id)).ReturnsAsync(new List<Project>());

        SetControllerUser("noaccess@x.com");
        // Act
        var result = await _controller.Export(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    [Description("REQ_FUN_003 + REQ-SEC-LOG-001: Missing project during export returns not found and logs warning")]
    public async Task REQ_FUN_003_Export_MissingProject_ReturnsNotFound()
    {
        // Arrange
        var owner = new User { Id = 99, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 100, Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 99, Email = "owner@x.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("owner@x.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockProjectService.Setup(s => s.GetAccessibleProjectsAsync(user.Id)).ReturnsAsync(new List<Project> { project });
        _mockExportService.Setup(s => s.BuildExportAsync(100)).ThrowsAsync(new KeyNotFoundException());

        SetControllerUser("owner@x.com");
        // Act
        var result = await _controller.Export(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
        _mockLogger.VerifyLog(LogLevel.Warning, "Export failed");
    }

    [Test]
    public async Task REQ_FUN_003_GetMyPermission_WithPermission_ReturnsOk()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 5, Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 2, Email = "user@x.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("user@x.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockPermissionService.Setup(s => s.GetUserPermissionAsync(2, 5)).ReturnsAsync(PermissionLevel.Edit);

        SetControllerUser("user@x.com");
        // Act
        var result = await _controller.GetMyPermission(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Has.Property("permission").EqualTo("Edit"));
        Assert.That(ok.Value, Has.Property("isOwner").EqualTo(false));
    }

    [Test]
    public async Task REQ_FUN_003_GetMyPermission_WhenNoEmail_ReturnsUnauthorized()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        SetUpProjectResolve(new Project { Id = 5, Slug = ProjectSlug, Owner = owner });
        SetControllerUser(null);
        // Act
        var result = await _controller.GetMyPermission(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_FUN_003_GetMyPermission_WhenNoPermission_ReturnsNoContent()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 5, Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 2, Email = "user@x.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("user@x.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockPermissionService.Setup(s => s.GetUserPermissionAsync(2, 5)).ReturnsAsync((PermissionLevel?)null);

        SetControllerUser("user@x.com");
        // Act
        var result = await _controller.GetMyPermission(OwnerSlug, ProjectSlug);
        // Assert
        Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_003_GetProjectPromises_WithValidProject_ReturnsOk()
    {
        // Arrange
        var owner = new User { Id = 1, Slug = OwnerSlug, Email = "o@x.com" };
        var project = new Project { Id = 10, Slug = ProjectSlug, Owner = owner };
        SetUpProjectResolve(project);

        var user = new User { Id = 2, Email = "user@x.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("user@x.com", It.IsAny<string?>())).ReturnsAsync(user);

        var promises = new List<Promise>
            {
                new Promise { Id = 1, Statement = "P1", ProjectId = 10, SequenceNumber = 1, DisplayOrder = 0 }
            };
        _mockProjectService.Setup(s => s.GetProductPromisesAsync(10)).ReturnsAsync(promises);
        _mockPromiseMapper.Setup(m => m.Map(It.IsAny<Promise>(), It.IsAny<IGenericService<Promise>>()))
            .Returns<Promise, IGenericService<Promise>>((p, svc) => new PromiseDto { Id = p.Id, Statement = p.Statement });

        SetControllerUser("user@x.com");
        // Act
        var result = await _controller.GetProjectPromises(OwnerSlug, ProjectSlug);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }
}
