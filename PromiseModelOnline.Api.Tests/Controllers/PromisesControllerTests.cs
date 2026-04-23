using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Controllers;

[TestFixture]
public class PromisesControllerTests
{
    private Mock<IPromiseService> _serviceMock = null!;
    private PromisesController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IPromiseService>();
        var logger = new Mock<ILogger<PromisesController>>();
        _controller = new PromisesController(_serviceMock.Object, logger.Object);
    }

    [Test]
    public async Task GetPromiseById_ReturnsNotFound_WhenMissing()
    {
        _serviceMock.Setup(x => x.GetPromiseByIdAsync(7)).ReturnsAsync((PromiseResponse?)null);

        var result = await _controller.GetPromiseById(7);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task CreatePromise_ReturnsBadRequest_WhenStatementBlank()
    {
        var result = await _controller.CreatePromise(1, new CreatePromiseRequest { Statement = "   " });

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task CreatePromise_ReturnsCreatedAtAction_WhenSuccessful()
    {
        _serviceMock
            .Setup(x => x.CreatePromiseAsync(1, It.IsAny<CreatePromiseRequest>()))
            .ReturnsAsync(new PromiseResponse { Id = 10, ProjectId = 1, Statement = "S1", StatusColor = "red" });

        var result = await _controller.CreatePromise(1, new CreatePromiseRequest { Statement = "S1" });

        Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result;
        Assert.That(created.ActionName, Is.EqualTo("GetPromiseById"));
    }
}
