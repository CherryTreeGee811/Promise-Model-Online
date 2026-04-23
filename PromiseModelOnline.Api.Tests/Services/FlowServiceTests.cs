using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Services;

[TestFixture]
public class FlowServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private Mock<IJourneyRepository> _journeyRepo = null!;
    private Mock<IFlowRepository> _flowRepo = null!;
    private Mock<IMomentRepository> _momentRepo = null!;
    private FlowService _service = null!;

    [SetUp]
    public void Setup()
    {
        _uow = new Mock<IUnitOfWork>();
        _journeyRepo = new Mock<IJourneyRepository>();
        _flowRepo = new Mock<IFlowRepository>();
        _momentRepo = new Mock<IMomentRepository>();

        _uow.SetupGet(x => x.Journeys).Returns(_journeyRepo.Object);
        _uow.SetupGet(x => x.Flows).Returns(_flowRepo.Object);
        _uow.SetupGet(x => x.Moments).Returns(_momentRepo.Object);

        var logger = new Mock<ILogger<FlowService>>();
        _service = new FlowService(_uow.Object, logger.Object);
    }

    [Test]
    public void GetFlowsByJourneyAsync_Throws_WhenJourneyMissing()
    {
        _journeyRepo.Setup(x => x.GetByIdAsync(8)).ReturnsAsync((Journey?)null);

        Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _service.GetFlowsByJourneyAsync(8, 1, 10));
    }

    [Test]
    public async Task DeleteFlowAsync_RemovesAndSaves_WhenFound()
    {
        var flow = new Flow { Id = 9, JourneyId = 1, Statement = "F" };
        _flowRepo.Setup(x => x.GetByIdAsync(9)).ReturnsAsync(flow);
        _uow.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

        var deleted = await _service.DeleteFlowAsync(9);

        Assert.That(deleted, Is.True);
        _flowRepo.Verify(x => x.Remove(flow), Times.Once);
        _uow.Verify(x => x.SaveChangesAsync(), Times.Once);
    }
}
