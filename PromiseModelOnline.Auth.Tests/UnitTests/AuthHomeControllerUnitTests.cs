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
        var controller = new HomeController();

        var result = controller.HealthCheck();

        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }
}
