using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class AuthHomeControllerUnitTests
{
    [Test]
    public void HealthCheck_ReturnsOk()
    {
        // Arrange
        var controller = new HomeController();

        // Act
        var result = controller.HealthCheck();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }
}
