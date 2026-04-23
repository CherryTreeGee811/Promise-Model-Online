using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Services;

[TestFixture]
public class JourneyServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private Mock<IEpicRepository> _epicRepo = null!;
    private Mock<IJourneyRepository> _journeyRepo = null!;
    private Mock<IFlowRepository> _flowRepo = null!;
    private JourneyService _service = null!;

    [SetUp]
    public void Setup()
    {
        _uow = new Mock<IUnitOfWork>();
        _epicRepo = new Mock<IEpicRepository>();
        _journeyRepo = new Mock<IJourneyRepository>();
        _flowRepo = new Mock<IFlowRepository>();

        _uow.SetupGet(x => x.Epics).Returns(_epicRepo.Object);
        _uow.SetupGet(x => x.Journeys).Returns(_journeyRepo.Object);
        _uow.SetupGet(x => x.Flows).Returns(_flowRepo.Object);

        var logger = new Mock<ILogger<JourneyService>>();
        _service = new JourneyService(_uow.Object, logger.Object);
    }

    [Test]
    public void CreateJourneyAsync_Throws_WhenEpicMissing()
    {
        _epicRepo.Setup(x => x.GetByIdAsync(5)).ReturnsAsync((Epic?)null);

        Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _service.CreateJourneyAsync(5, new CreateJourneyRequest { Statement = "J1" }));
    }

    [Test]
    public async Task UpdateJourneyAsync_UpdatesCoreFieldsAndSaves()
    {
        var journey = new Journey { Id = 2, EpicId = 1, Statement = "Old", StatusColor = "red" };
        _journeyRepo.Setup(x => x.GetByIdAsync(2)).ReturnsAsync(journey);
        _flowRepo.Setup(x => x.CountFlowsByJourneyAsync(2)).ReturnsAsync(0);
        _uow.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateJourneyAsync(2, new UpdateJourneyRequest { Statement = " New ", StatusColor = "green" });

        _journeyRepo.Verify(x => x.Update(It.IsAny<Journey>()), Times.Once);
        _uow.Verify(x => x.SaveChangesAsync(), Times.Once);
        Assert.That(result.Statement, Is.EqualTo("New"));
        Assert.That(result.StatusColor, Is.EqualTo("green"));
    }
}
