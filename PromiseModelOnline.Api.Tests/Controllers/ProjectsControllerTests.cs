using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Controllers;

[TestFixture]
public class ProjectsControllerTests
{
    private Mock<IProjectService> _serviceMock = null!;
    private ProjectsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IProjectService>();
        var logger = new Mock<ILogger<ProjectsController>>();
        _controller = new ProjectsController(_serviceMock.Object, logger.Object);
    }

    [Test]
    public async Task GetProjectById_ReturnsOk_WhenProjectExists()
    {
        _serviceMock
            .Setup(x => x.GetProjectByIdAsync(1))
            .ReturnsAsync(new ProjectResponse { Id = 1, Name = "Project A", OwnerId = 44 });

        var result = await _controller.GetProjectById(1);

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result;
        Assert.That(ok.StatusCode, Is.EqualTo(200));
    }

    [Test]
    public async Task GetProjectById_ReturnsNotFound_WhenProjectMissing()
    {
        _serviceMock
            .Setup(x => x.GetProjectByIdAsync(404))
            .ReturnsAsync((ProjectResponse?)null);

        var result = await _controller.GetProjectById(404);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task CreateProject_ReturnsBadRequest_WhenNameIsBlank()
    {
        var result = await _controller.CreateProject(new CreateProjectRequest { Name = "  " });

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task CreateProject_ReturnsCreatedAt_WhenSuccessful()
    {
        _serviceMock
            .Setup(x => x.CreateProjectAsync(It.IsAny<CreateProjectRequest>()))
            .ReturnsAsync(new ProjectResponse { Id = 2, Name = "Created", OwnerId = 99 });

        var result = await _controller.CreateProject(new CreateProjectRequest { Name = "Created", OwnerId = 99 });

        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result;
        Assert.That(created.ActionName, Is.EqualTo("GetProjectById"));
        Assert.That(created.StatusCode, Is.EqualTo(201));
    }

    [Test]
    public async Task UpdateProject_ReturnsNotFound_WhenServiceThrowsKeyNotFound()
    {
        _serviceMock
            .Setup(x => x.UpdateProjectAsync(7, It.IsAny<UpdateProjectRequest>()))
            .ThrowsAsync(new KeyNotFoundException("missing"));

        var result = await _controller.UpdateProject(7, new UpdateProjectRequest { Name = "X" });

        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
}
