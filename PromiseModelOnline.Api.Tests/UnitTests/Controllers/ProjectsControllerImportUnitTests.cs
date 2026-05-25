using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

public class ProjectsControllerImportUnitTests
{
    private Mock<IProjectService> _mockProjectService = null!;
    private Mock<IGenericMapper<Project, ProjectDTO>> _mockMapper = null!;
    private Mock<IUserRepository> _mockUserRepo = null!;
    private Mock<IPermissionService> _mockPermissionService = null!;
    private Mock<IGenericService<Promise>> _mockPromiseService = null!;
    private Mock<IGenericMapper<Promise, PromiseDTO>> _mockPromiseMapper = null!;
    private Mock<IProjectExportService> _mockProjectExportService = null!;
    private Mock<IProjectImportService> _mockProjectImportService = null!;
    private Mock<IProjectImportValidationService> _mockProjectImportValidationService = null!;
    private ProjectsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _mockProjectService = new Mock<IProjectService>();
        _mockMapper = new Mock<IGenericMapper<Project, ProjectDTO>>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockPermissionService = new Mock<IPermissionService>();
        _mockPromiseService = new Mock<IGenericService<Promise>>();
        _mockPromiseMapper = new Mock<IGenericMapper<Promise, PromiseDTO>>();
        _mockProjectExportService = new Mock<IProjectExportService>();
        _mockProjectImportService = new Mock<IProjectImportService>();
        _mockProjectImportValidationService = new Mock<IProjectImportValidationService>();
    }

    private void InitControllerWithUser(string? email, string? nameid = null)
    {
        _controller = new ProjectsController(
            _mockProjectService.Object,
            _mockMapper.Object,
            _mockUserRepo.Object,
            _mockPermissionService.Object,
            _mockPromiseService.Object,
            _mockPromiseMapper.Object,
            _mockProjectExportService.Object,
            _mockProjectImportService.Object,
            _mockProjectImportValidationService.Object);

        var claims = new List<Claim>();
        if (email is not null) claims.Add(new Claim(ClaimTypes.Email, email));
        if (nameid is not null) claims.Add(new Claim("nameid", nameid));
        var identity = new ClaimsIdentity(claims, "test");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    [Test]
    public async Task Import_WithValidFile_ReturnsCreatedResult()
    {
        var user = new User { Id = 77, Email = "importer@example.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("importer@example.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockProjectImportValidationService.Setup(s => s.ValidateAsync(It.IsAny<Stream>())).ReturnsAsync(new ProjectImportValidationResult
        {
            Document = new ProjectExportDocument { Project = new ProjectExportProject { Id = 1, Name = "Imported" } }
        });
        _mockProjectImportService.Setup(s => s.ImportAsync(It.IsAny<ProjectExportDocument>(), user.Id)).ReturnsAsync(new ProjectImportResult
        {
            ProjectId = 123,
            Warnings = new List<string> { "remapped owner" }
        });

        InitControllerWithUser("importer@example.com");

        var file = new FormFile(new MemoryStream(Encoding.UTF8.GetBytes("{\"schemaVersion\":\"1.0\"}")), 0, 28, "file", "import.json");

        var result = await _controller.Import(file);

        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var created = result as CreatedAtActionResult;
        Assert.That(created, Is.Not.Null);
        var payload = created!.Value as ProjectImportResult;
        Assert.That(payload, Is.Not.Null);
        Assert.That(payload!.ProjectId, Is.EqualTo(123));
        Assert.That(payload.Warnings, Has.Count.EqualTo(1));
        _mockProjectImportValidationService.Verify(s => s.ValidateAsync(It.IsAny<Stream>()), Times.Once);
        _mockProjectImportService.Verify(s => s.ImportAsync(It.IsAny<ProjectExportDocument>(), user.Id), Times.Once);
    }

    [Test]
    public async Task Import_WithInvalidFile_ReturnsBadRequest()
    {
        var user = new User { Id = 77, Email = "importer@example.com" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("importer@example.com", It.IsAny<string?>())).ReturnsAsync(user);
        _mockProjectImportValidationService.Setup(s => s.ValidateAsync(It.IsAny<Stream>())).ReturnsAsync(new ProjectImportValidationResult
        {
            Errors = { "Malformed JSON" },
            Warnings = { "ignored warning" }
        });

        InitControllerWithUser("importer@example.com");

        var file = new FormFile(new MemoryStream(Encoding.UTF8.GetBytes("bad")), 0, 3, "file", "import.json");

        var result = await _controller.Import(file);

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockProjectImportService.Verify(s => s.ImportAsync(It.IsAny<ProjectExportDocument>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task Import_MissingEmail_ReturnsUnauthorized()
    {
        InitControllerWithUser(null);
        var file = new FormFile(new MemoryStream(Encoding.UTF8.GetBytes("{}")), 0, 2, "file", "import.json");

        var result = await _controller.Import(file);

        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
    }
}
