using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Services;

[TestFixture]
public class EpicServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private Mock<IPromiseRepository> _promiseRepo = null!;
    private Mock<IEpicRepository> _epicRepo = null!;
    private Mock<IJourneyRepository> _journeyRepo = null!;
    private EpicService _service = null!;

    [SetUp]
    public void Setup()
    {
        _uow = new Mock<IUnitOfWork>();
        _promiseRepo = new Mock<IPromiseRepository>();
        _epicRepo = new Mock<IEpicRepository>();
        _journeyRepo = new Mock<IJourneyRepository>();

        _uow.SetupGet(x => x.Promises).Returns(_promiseRepo.Object);
        _uow.SetupGet(x => x.Epics).Returns(_epicRepo.Object);
        _uow.SetupGet(x => x.Journeys).Returns(_journeyRepo.Object);

        var logger = new Mock<ILogger<EpicService>>();
        _service = new EpicService(_uow.Object, logger.Object);
    }

    [Test]
    public void CreateEpicAsync_Throws_WhenParentPromiseMissing()
    {
        _promiseRepo.Setup(x => x.GetByIdAsync(12)).ReturnsAsync((Promise?)null);

        Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _service.CreateEpicAsync(12, new CreateEpicRequest { Statement = "E1" }));
    }

    [Test]
    public async Task GetEpicsByPromiseAsync_ClampsPageValues()
    {
        _promiseRepo.Setup(x => x.GetByIdAsync(1)).ReturnsAsync(new Promise { Id = 1, Statement = "P", ProjectId = 3, StatusColor = "red" });
        _epicRepo.Setup(x => x.GetEpicsByPromiseOrderedAsync(1, 0, 100)).ReturnsAsync(new List<Epic>());
        _epicRepo.Setup(x => x.CountEpicsByPromiseAsync(1)).ReturnsAsync(0);

        var result = await _service.GetEpicsByPromiseAsync(1, 0, 1000);

        Assert.That(result.PageNumber, Is.EqualTo(1));
        Assert.That(result.PageSize, Is.EqualTo(100));
    }
}
