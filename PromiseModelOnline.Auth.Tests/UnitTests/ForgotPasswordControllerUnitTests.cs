using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;
using Microsoft.AspNetCore.Routing;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="ForgotPasswordController"/> covering the forgot-password flow and email enumeration prevention.</summary>
public class ForgotPasswordControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IEmailService> _emailServiceMock = null!;
    private Mock<ILogger<ForgotPasswordController>> _loggerMock = null!;
    private Mock<IUrlHelper> _urlHelperMock = null!;
    private Mock<IWebHostEnvironment> _envMock = null!;
    private ForgotPasswordController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<ForgotPasswordController>>();
        _urlHelperMock = new Mock<IUrlHelper>();
        _envMock = new Mock<IWebHostEnvironment>();
        _controller = new ForgotPasswordController(
            _userManagerMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object,
            _envMock.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.Url = _urlHelperMock.Object;
    }

    [TearDown]
    public void TearDown() => _controller.Dispose();

    [Test]
    public void Index_ReturnsView()
    {
        // Arrange

        // Act
        var result = _controller.Index();

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
    }

    [Test]
    public async Task SendResetLink_ValidConfirmedEmail_SendsEmailAndReturnsSuccess()
    {
        // Arrange
        var model = new ForgotPasswordViewModel { Email = "user@example.com" };
        var user = new IdentityUser { Id = "1", UserName = "testuser", Email = "user@example.com" };
        _userManagerMock.Setup(x => x.FindByEmailAsync("user@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("mock-token");
        _urlHelperMock.Setup(x => x.Action(It.IsAny<UrlActionContext>())).Returns("https://localhost/reset");

        // Act
        var result = await _controller.SendResetLink(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Sent, Is.True);
        _emailServiceMock.Verify(x => x.SendResetPasswordEmailAsync("user@example.com", "testuser", It.IsAny<string>()), Times.Once);
        _loggerMock.VerifyLog(LogLevel.Information, "Password reset email sent");
    }

    [Test]
    public async Task SendResetLink_UnknownEmail_ReturnsSuccessWithoutSendingEmail()
    {
        // Arrange
        var model = new ForgotPasswordViewModel { Email = "unknown@example.com" };
        _userManagerMock.Setup(x => x.FindByEmailAsync("unknown@example.com")).ReturnsAsync((IdentityUser?)null);

        // Act
        var result = await _controller.SendResetLink(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Sent, Is.True);
        _emailServiceMock.Verify(x => x.SendResetPasswordEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task SendResetLink_UnconfirmedEmail_ReturnsSuccessWithoutSendingEmail()
    {
        // Arrange
        var model = new ForgotPasswordViewModel { Email = "unconfirmed@example.com" };
        var user = new IdentityUser { Id = "2", UserName = "unconfirmed", Email = "unconfirmed@example.com", EmailConfirmed = false };
        _userManagerMock.Setup(x => x.FindByEmailAsync("unconfirmed@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _controller.SendResetLink(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Sent, Is.True);
        _emailServiceMock.Verify(x => x.SendResetPasswordEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task SendResetLink_PasswordlessGoogleUser_CreatesLocalPasswordViaReset()
    {
        // Arrange
        var model = new ForgotPasswordViewModel { Email = "google@example.com" };
        var user = new IdentityUser { Id = "3", UserName = "google-user", Email = "google@example.com", EmailConfirmed = true };
        _userManagerMock.Setup(x => x.FindByEmailAsync("google@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("google-token");
        _urlHelperMock.Setup(x => x.Action(It.IsAny<UrlActionContext>())).Returns("https://localhost/reset?token=google-token");

        // Act
        var result = await _controller.SendResetLink(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Sent, Is.True);
        _emailServiceMock.Verify(x => x.SendResetPasswordEmailAsync("google@example.com", "google-user", It.Is<string>(link => link.Contains("google-token"))), Times.Once);
        _loggerMock.VerifyLog(LogLevel.Information, "Password reset email sent");
    }

    [Test]
    public async Task SendResetLink_TokenIsNotDoubleEncoded_PassesRawTokenToUrlHelper()
    {
        // Arrange
        var model = new ForgotPasswordViewModel { Email = "user@example.com" };
        var user = new IdentityUser { Id = "4", UserName = "testuser", Email = "user@example.com", EmailConfirmed = true };
        var rawToken = "CfDJ8+b/y/===";
        _userManagerMock.Setup(x => x.FindByEmailAsync("user@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(user)).ReturnsAsync(rawToken);
        UrlActionContext? capturedContext = null;
        _urlHelperMock.Setup(x => x.Action(It.IsAny<UrlActionContext>()))
            .Callback<UrlActionContext>(ctx => capturedContext = ctx)
            .Returns("https://localhost/reset");

        // Act
        var result = await _controller.SendResetLink(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(capturedContext, Is.Not.Null);
        var tokenValue = capturedContext!.Values switch
        {
            RouteValueDictionary dict => dict["token"],
            _ => capturedContext.Values?.GetType().GetProperty("token")?.GetValue(capturedContext.Values)
        };
        Assert.That(tokenValue, Is.EqualTo(rawToken));
    }

    [Test]
    public async Task SendResetLink_InvalidModel_ReturnsViewWithErrors()
    {
        // Arrange
        _controller.ModelState.AddModelError("Email", "Required");

        // Act
        var result = await _controller.SendResetLink(new ForgotPasswordViewModel());

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState.IsValid, Is.False);
        _emailServiceMock.Verify(x => x.SendResetPasswordEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task SendResetLink_UrlGenerationFails_LogsErrorAndReturnsModelError()
    {
        // Arrange
        var model = new ForgotPasswordViewModel { Email = "user@example.com" };
        var user = new IdentityUser { Id = "1", UserName = "testuser", Email = "user@example.com" };
        _userManagerMock.Setup(x => x.FindByEmailAsync("user@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("mock-token");
        _urlHelperMock.Setup(x => x.Action(It.IsAny<UrlActionContext>())).Returns((string?)null);

        // Act
        var result = await _controller.SendResetLink(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("An error occurred. Please try again."));
        _loggerMock.VerifyLog(LogLevel.Error, "Failed to generate reset link");
        _emailServiceMock.Verify(x => x.SendResetPasswordEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }
}
