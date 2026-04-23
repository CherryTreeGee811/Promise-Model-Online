using Moq;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Services;

[TestFixture]
public class MomentServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private Mock<IFlowRepository> _flowRepo = null!;
    private Mock<IMomentRepository> _momentRepo = null!;
    private MomentService _service = null!;

    [SetUp]
    public void Setup()
    {
        _uow = new Mock<IUnitOfWork>();
        _flowRepo = new Mock<IFlowRepository>();
        _momentRepo = new Mock<IMomentRepository>();

        _uow.SetupGet(x => x.Flows).Returns(_flowRepo.Object);
        _uow.SetupGet(x => x.Moments).Returns(_momentRepo.Object);

        _service = new MomentService(_uow.Object);
    }

    [Test]
    public void CreateMomentAsync_Throws_WhenFlowMissing()
    {
        _flowRepo.Setup(x => x.GetByIdAsync(3)).ReturnsAsync((Flow?)null);

        Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.CreateMomentAsync(3, new CreateMomentRequest { Statement = "M1" }));
    }

    [Test]
    public async Task CompleteMomentAsync_SetsDoneAndTimestamps_WhenFound()
    {
        var moment = new Moment { Id = 4, FlowId = 1, Statement = "M", Status = MomentStatus.Todo };
        _momentRepo.Setup(x => x.GetByIdAsync(4)).ReturnsAsync(moment);
        _uow.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.CompleteMomentAsync(4);

        Assert.That(result, Is.True);
        Assert.That(moment.Status, Is.EqualTo(MomentStatus.Done));
        Assert.That(moment.CompletedAt, Is.Not.Null);
        Assert.That(moment.UpdatedAt, Is.Not.Null);
        _momentRepo.Verify(x => x.Update(moment), Times.Once);
    }
}
