using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Controllers;

[TestFixture]
public class MomentsControllerTests
{
    private Mock<IMomentService> _serviceMock = null!;
    private MomentsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IMomentService>();
        var logger = new Mock<ILogger<MomentsController>>();
        _controller = new MomentsController(_serviceMock.Object, logger.Object);
    }

    [Test]
    public async Task GetMomentById_ReturnsOk_WhenFound()
    {
        _serviceMock
            .Setup(x => x.GetMomentByIdAsync(5))
            .ReturnsAsync(new MomentResponse { Id = 5, FlowId = 1, Statement = "M", Status = MomentStatus.Todo, StatusColor = "red" });

        var result = await _controller.GetMomentById(5);

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task CompleteMoment_ReturnsNotFound_WhenServiceReturnsFalse()
    {
        _serviceMock.Setup(x => x.CompleteMomentAsync(8)).ReturnsAsync(false);

        var result = await _controller.CompleteMoment(8);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task CompleteMoment_ReturnsUpdatedMoment_WhenSuccessful()
    {
        _serviceMock.Setup(x => x.CompleteMomentAsync(9)).ReturnsAsync(true);
        _serviceMock
            .Setup(x => x.GetMomentByIdAsync(9))
            .ReturnsAsync(new MomentResponse { Id = 9, FlowId = 3, Statement = "Done", Status = MomentStatus.Done, StatusColor = "green" });

        var result = await _controller.CompleteMoment(9);

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result;
        Assert.That(ok.Value, Is.InstanceOf<MomentResponse>());
    }
}
