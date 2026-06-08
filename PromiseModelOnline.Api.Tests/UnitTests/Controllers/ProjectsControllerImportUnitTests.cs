using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
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
    private Mock<IProjectImportService> _mockProjectImportService = null!;
    private Mock<IProjectImportValidationService> _mockProjectImportValidationService = null!;
    private Mock<IGenericService<Project>> _mockGenericService = null!;
    private UserProjectsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _mockProjectService = new Mock<IProjectService>();
        _mockMapper = new Mock<IGenericMapper<Project, ProjectDTO>>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockProjectImportService = new Mock<IProjectImportService>();
        _mockProjectImportValidationService = new Mock<IProjectImportValidationService>();
        _mockGenericService = new Mock<IGenericService<Project>>();
        _controller = new UserProjectsController(
            _mockProjectService.Object,
            _mockUserRepo.Object,
            _mockMapper.Object,
            _mockGenericService.Object,
            _mockProjectImportService.Object,
            _mockProjectImportValidationService.Object);
    }

    [Test]
    public async Task Import_NotAuthenticated_ReturnsUnauthorized()
    {
        ControllerTestHelpers.SetControllerUser(_controller, null);

        var stream = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
        var file = new FormFile(stream, 0, stream.Length, "file", "test.json");
        var result = await _controller.Import(file);

        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task Import_WithValidFile_ReturnsCreated()
    {
        var user = new User { Id = 1, Email = "importer@x.com", Slug = "importer" };
        _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("importer@x.com", It.IsAny<string?>())).ReturnsAsync(user);

        ControllerTestHelpers.SetControllerUser(_controller, "importer@x.com");

        var json = "{\"schemaVersion\":\"1.0\",\"project\":{\"id\":1,\"name\":\"Test\"}}";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(json));
        var file = new FormFile(stream, 0, stream.Length, "file", "test.json");

        var validationResult = new ProjectImportValidationResult
        {
            Document = new ProjectExportDocument
            {
                SchemaVersion = "1.0",
                Project = new ProjectExportProject { Id = 1, Name = "Test" }
            }
        };
        _mockProjectImportValidationService.Setup(s => s.ValidateAsync(It.IsAny<Stream>())).ReturnsAsync(validationResult);
        _mockProjectImportService.Setup(s => s.ImportAsync(It.IsAny<ProjectExportDocument>(), 1)).ReturnsAsync(new ProjectImportResult { ProjectId = 1 });

        var result = await _controller.Import(file);

        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
    }
}
