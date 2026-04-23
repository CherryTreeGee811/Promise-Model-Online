using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Services;

[TestFixture]
public class PromiseServiceTests
{
    private Mock<IUnitOfWork> _unitOfWorkMock = null!;
    private Mock<IProjectRepository> _projectRepositoryMock = null!;
    private Mock<IPromiseRepository> _promiseRepositoryMock = null!;
    private Mock<IEpicRepository> _epicRepositoryMock = null!;
    private PromiseService _service = null!;

    [SetUp]
    public void Setup()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _projectRepositoryMock = new Mock<IProjectRepository>();
        _promiseRepositoryMock = new Mock<IPromiseRepository>();
        _epicRepositoryMock = new Mock<IEpicRepository>();

        _unitOfWorkMock.SetupGet(x => x.Projects).Returns(_projectRepositoryMock.Object);
        _unitOfWorkMock.SetupGet(x => x.Promises).Returns(_promiseRepositoryMock.Object);
        _unitOfWorkMock.SetupGet(x => x.Epics).Returns(_epicRepositoryMock.Object);

        var logger = new Mock<ILogger<PromiseService>>();
        _service = new PromiseService(_unitOfWorkMock.Object, logger.Object);
    }

    [Test]
    public void CreatePromiseAsync_ThrowsKeyNotFound_WhenProjectMissing()
    {
        _projectRepositoryMock
            .Setup(x => x.GetByIdAsync(123))
            .ReturnsAsync((Project?)null);

        var request = new CreatePromiseRequest { Statement = "Test" };

        Assert.ThrowsAsync<KeyNotFoundException>(async () => await _service.CreatePromiseAsync(123, request));
    }

    [Test]
    public void CreatePromiseAsync_ThrowsArgumentException_WhenStatementIsBlank()
    {
        _projectRepositoryMock
            .Setup(x => x.GetByIdAsync(1))
            .ReturnsAsync(new Project { Id = 1, Name = "P1", OwnerId = 7 });

        var request = new CreatePromiseRequest { Statement = "   " };

        Assert.ThrowsAsync<ArgumentException>(async () => await _service.CreatePromiseAsync(1, request));
    }

    [Test]
    public async Task GetPromisesByProjectAsync_ClampsPageAndReturnsPagedResult()
    {
        _projectRepositoryMock
            .Setup(x => x.GetByIdAsync(1))
            .ReturnsAsync(new Project { Id = 1, Name = "P1", OwnerId = 7 });
        _promiseRepositoryMock
            .Setup(x => x.GetPromisesByProjectOrderedAsync(1, 0, 100))
            .ReturnsAsync(new List<Promise>
            {
                new() { Id = 1, ProjectId = 1, Statement = "S1", StatusColor = "red", DisplayOrder = 0 }
            });
        _promiseRepositoryMock
            .Setup(x => x.CountPromisesByProjectAsync(1))
            .ReturnsAsync(1);

        var result = await _service.GetPromisesByProjectAsync(1, 0, 101);

        Assert.That(result.PageNumber, Is.EqualTo(1));
        Assert.That(result.PageSize, Is.EqualTo(100));
        Assert.That(result.TotalCount, Is.EqualTo(1));
        Assert.That(result.Items, Has.Count.EqualTo(1));
    }
}
