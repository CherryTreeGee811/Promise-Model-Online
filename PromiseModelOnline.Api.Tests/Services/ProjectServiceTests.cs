using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Services;

[TestFixture]
public class ProjectServiceTests
{
    private Mock<IUnitOfWork> _unitOfWorkMock = null!;
    private Mock<IProjectRepository> _projectRepositoryMock = null!;
    private Mock<IPromiseRepository> _promiseRepositoryMock = null!;
    private ProjectService _service = null!;

    [SetUp]
    public void Setup()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _projectRepositoryMock = new Mock<IProjectRepository>();
        _promiseRepositoryMock = new Mock<IPromiseRepository>();

        _unitOfWorkMock.SetupGet(x => x.Projects).Returns(_projectRepositoryMock.Object);
        _unitOfWorkMock.SetupGet(x => x.Promises).Returns(_promiseRepositoryMock.Object);

        var logger = new Mock<ILogger<ProjectService>>();
        _service = new ProjectService(_unitOfWorkMock.Object, logger.Object);
    }

    [Test]
    public async Task GetProjectsAsync_ClampsPageNumberAndPageSize()
    {
        _projectRepositoryMock
            .Setup(x => x.GetAllAsync(0, 100))
            .ReturnsAsync(new List<Project>());
        _projectRepositoryMock
            .Setup(x => x.CountAsync())
            .ReturnsAsync(0);

        var result = await _service.GetProjectsAsync(0, 101);

        Assert.That(result.PageNumber, Is.EqualTo(1));
        Assert.That(result.PageSize, Is.EqualTo(100));
    }

    [Test]
    public void CreateProjectAsync_ThrowsArgumentException_WhenNameIsBlank()
    {
        var request = new CreateProjectRequest { Name = "  ", OwnerId = 1 };

        Assert.ThrowsAsync<ArgumentException>(async () => await _service.CreateProjectAsync(request));
    }

    [Test]
    public async Task CreateProjectAsync_AddsProjectAndSaves()
    {
        var request = new CreateProjectRequest
        {
            Name = "  PMO  ",
            Description = "  Desc  ",
            OwnerId = 99
        };

        _unitOfWorkMock.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.CreateProjectAsync(request);

        _projectRepositoryMock.Verify(
            x => x.AddAsync(It.Is<Project>(p => p.Name == "PMO" && p.Description == "Desc" && p.OwnerId == 99)),
            Times.Once);
        _unitOfWorkMock.Verify(x => x.SaveChangesAsync(), Times.Once);
        Assert.That(result.Name, Is.EqualTo("PMO"));
        Assert.That(result.Description, Is.EqualTo("Desc"));
    }
}
