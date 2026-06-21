using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using OpenIddict.Server.AspNetCore;
using PromiseModelOnline.Auth.Controllers;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="LogoutController"/> covering end-session and audit logging.</summary>
// Requirements: REQ_USE_008 REQ-SEC-LOG-001
public class LogoutControllerUnitTests
{
    private Mock<ILogger<LogoutController>> _loggerMock = null!;
    private LogoutController _controller = null!;

    [SetUp]
    public void Setup()
    {
        _loggerMock = new Mock<ILogger<LogoutController>>();
        _controller = new LogoutController(_loggerMock.Object);

        var httpContext = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "user-123"),
        };
        var identity = new ClaimsIdentity(claims, "test");
        httpContext.User = new ClaimsPrincipal(identity);

        var authService = new Mock<IAuthenticationService>();
        authService
            .Setup(s => s.SignOutAsync(httpContext, IdentityConstants.ApplicationScheme, null))
            .Returns(Task.CompletedTask);
        authService
            .Setup(s => s.SignOutAsync(httpContext, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, null))
            .Returns(Task.CompletedTask);

        httpContext.RequestServices = new ServiceCollection()
            .AddSingleton(authService.Object)
            .BuildServiceProvider();

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Test]
    [Description("REQ_USE_008 + REQ-SEC-LOG-001: Authenticated user logout signs out and logs info")]
    public async Task Logout_AuthenticatedUser_ReturnsSignOut()
    {
        // Act
        var result = await _controller.Logout();

        // Assert
        Assert.That(result, Is.InstanceOf<SignOutResult>());
        _loggerMock.VerifyLog(LogLevel.Information, "Logout: user user-123 signed out");
    }

    [Test]
    [Description("REQ_USE_008 + REQ-SEC-LOG-001: Logout without NameIdentifier falls back to unknown")]
    public async Task Logout_WithoutNameIdentifier_LogsUnknown()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(null, "test"));

        var authService = new Mock<IAuthenticationService>();
        authService
            .Setup(s => s.SignOutAsync(httpContext, IdentityConstants.ApplicationScheme, null))
            .Returns(Task.CompletedTask);
        authService
            .Setup(s => s.SignOutAsync(httpContext, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, null))
            .Returns(Task.CompletedTask);

        httpContext.RequestServices = new ServiceCollection()
            .AddSingleton(authService.Object)
            .BuildServiceProvider();

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        // Act
        var result = await _controller.Logout();

        // Assert
        Assert.That(result, Is.InstanceOf<SignOutResult>());
        _loggerMock.VerifyLog(LogLevel.Information, "Logout: user unknown signed out");
    }
}
