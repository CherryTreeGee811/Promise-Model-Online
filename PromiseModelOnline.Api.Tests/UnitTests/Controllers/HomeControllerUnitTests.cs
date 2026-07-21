using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class HomeControllerUnitTests
{
    [Test]
    public void REQ_FUN_XXX_HealthCheck_ReturnsOk()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<HomeController>>();
        var controller = new HomeController(loggerMock.Object);

        // Act
        var result = controller.HealthCheck();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }
}
