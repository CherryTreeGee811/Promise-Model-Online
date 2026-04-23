using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Controllers;

[TestFixture]
public class JourneysControllerTests
{
    private Mock<IJourneyService> _serviceMock = null!;
    private JourneysController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IJourneyService>();
        var logger = new Mock<ILogger<JourneysController>>();
        _controller = new JourneysController(_serviceMock.Object, logger.Object);
    }

    [Test]
    public async Task GetJourneyById_ReturnsOk_WhenFound()
    {
        _serviceMock
            .Setup(x => x.GetJourneyByIdAsync(4))
            .ReturnsAsync(new JourneyResponse { Id = 4, EpicId = 1, Statement = "J1", StatusColor = "red" });

        var result = await _controller.GetJourneyById(4);

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task UpdateJourney_ReturnsNotFound_WhenServiceThrowsInvalidOperation()
    {
        _serviceMock
            .Setup(x => x.UpdateJourneyAsync(9, It.IsAny<UpdateJourneyRequest>()))
            .ThrowsAsync(new InvalidOperationException("missing"));

        var result = await _controller.UpdateJourney(9, new UpdateJourneyRequest { Statement = "x" });

        Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
    }
}
