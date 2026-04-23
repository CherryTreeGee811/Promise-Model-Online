using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Controllers;

[TestFixture]
public class EpicsControllerTests
{
    private Mock<IEpicService> _serviceMock = null!;
    private EpicsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IEpicService>();
        var logger = new Mock<ILogger<EpicsController>>();
        _controller = new EpicsController(_serviceMock.Object, logger.Object);
    }

    [Test]
    public async Task GetEpicById_ReturnsNotFound_WhenMissing()
    {
        _serviceMock.Setup(x => x.GetEpicByIdAsync(2)).ReturnsAsync((EpicResponse?)null);

        var result = await _controller.GetEpicById(2);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task CreateEpic_ReturnsBadRequest_WhenStatementBlank()
    {
        var result = await _controller.CreateEpic(1, new CreateEpicRequest { Statement = "   " });

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task CreateEpic_ReturnsCreatedAtAction_WhenSuccessful()
    {
        _serviceMock
            .Setup(x => x.CreateEpicAsync(1, It.IsAny<CreateEpicRequest>()))
            .ReturnsAsync(new EpicResponse { Id = 7, ProductPromiseId = 1, Statement = "E1", StatusColor = "red" });

        var result = await _controller.CreateEpic(1, new CreateEpicRequest { Statement = "E1" });

        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result;
        Assert.That(created.ActionName, Is.EqualTo("GetEpicById"));
    }
}
