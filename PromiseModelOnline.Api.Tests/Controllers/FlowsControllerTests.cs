using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Services.Interfaces;

namespace PromiseModelOnline.Api.Tests.Controllers;

[TestFixture]
public class FlowsControllerTests
{
    private Mock<IFlowService> _serviceMock = null!;
    private FlowsController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IFlowService>();
        var logger = new Mock<ILogger<FlowsController>>();
        _controller = new FlowsController(_serviceMock.Object, logger.Object);
    }

    [Test]
    public async Task CreateFlow_ReturnsBadRequest_WhenStatementBlank()
    {
        var result = await _controller.CreateFlow(1, new CreateFlowRequest { Statement = "  " });

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task DeleteFlow_ReturnsNoContent_WhenDeleted()
    {
        _serviceMock.Setup(x => x.DeleteFlowAsync(12)).ReturnsAsync(true);

        var result = await _controller.DeleteFlow(12);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }
}
