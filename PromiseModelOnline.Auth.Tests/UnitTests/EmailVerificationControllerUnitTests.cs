using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.Models;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class EmailVerificationControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IEmailService> _emailServiceMock = null!;
    private Mock<ILogger<EmailVerificationController>> _loggerMock = null!;
    private IMemoryCache _cache = null!;
    private Mock<IWebHostEnvironment> _envMock = null!;
    private EmailVerificationController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        var userStore = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<EmailVerificationController>>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _envMock = new Mock<IWebHostEnvironment>();

        _controller = new EmailVerificationController(
            _userManagerMock.Object,
            _emailServiceMock.Object,
            _loggerMock.Object,
            _cache,
            _envMock.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [TearDown]
    public void TearDown()
    {
        _controller.Dispose();
        _cache.Dispose();
    }

    [Test]
    public async Task Index_NullUserId_RedirectsToLogin()
    {
        // Arrange

        // Act
        var result = await _controller.Index(null, null);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public async Task Index_UserNotFound_RedirectsToLogin()
    {
        // Arrange
        _userManagerMock.Setup(u => u.FindByIdAsync("bad-id")).ReturnsAsync((IdentityUser?)null);

        // Act
        var result = await _controller.Index("bad-id", null);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public async Task Index_EmailAlreadyConfirmed_RedirectsToLogin()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(true);

        // Act
        var result = await _controller.Index("1", null);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        var redirect = (RedirectToActionResult)result;
        Assert.That(redirect.ActionName, Is.EqualTo("Index"));
    }

    [Test]
    public async Task Index_ValidUser_ReturnsView()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _controller.Index("1", null);

        // Assert
        Assert.That(result, Is.InstanceOf<ViewResult>());
    }

    [Test]
    public async Task Confirm_ValidCode_ConfirmsEmailAndRedirects()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(false);
        _userManagerMock.Setup(u => u.GenerateEmailConfirmationTokenAsync(user)).ReturnsAsync("token");
        _userManagerMock.Setup(u => u.ConfirmEmailAsync(user, "token")).ReturnsAsync(IdentityResult.Success);

        _cache.Set("verify_code:1", "123456");

        var request = new ConfirmEmailRequest { UserId = "1", Code = "123456" };

        // Act
        var result = await _controller.Confirm(request);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        var redirect = (RedirectToActionResult)result;
        Assert.That(redirect.ActionName, Is.EqualTo("Index"));
    }

    [Test]
    public async Task Confirm_WrongCode_ReturnsViewWithError()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(false);

        _cache.Set("verify_code:1", "000000");

        var request = new ConfirmEmailRequest { UserId = "1", Code = "123456" };

        // Act
        var result = await _controller.Confirm(request);

        // Assert
        Assert.That(result, Is.InstanceOf<ViewResult>());
    }

    [Test]
    public async Task Resend_GeneratesCodeAndSendsEmail()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com", UserName = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(false);
        _emailServiceMock.Setup(e => e.SendVerificationEmailAsync("u@t.com", "u@t.com", It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Resend("1");

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        _emailServiceMock.Verify(e => e.SendVerificationEmailAsync("u@t.com", "u@t.com", It.IsAny<string>()), Times.Once);
    }

    [Test]
    public async Task Resend_NullUserId_RedirectsToLogin()
    {
        // Arrange

        // Act
        var result = await _controller.Resend(null);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public void GetVerificationCode_Development_ReturnsCode()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");
        var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        _cache.Set($"verify_code:{userId}", "654321");

        // Act
        var result = _controller.GetVerificationCode(userId);

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public void GetVerificationCode_Production_ReturnsNotFound()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Production");

        var userId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        // Act
        var result = _controller.GetVerificationCode(userId);

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Index_WithResentParam_SetsViewBag()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _controller.Index("1", "true");

        // Assert
        Assert.That(result, Is.InstanceOf<ViewResult>());
        Assert.That(_controller.ViewBag.Resent, Is.True);
    }

    [Test]
    public async Task Confirm_UserNotFound_ReturnsRedirect()
    {
        // Arrange
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync((IdentityUser?)null);

        var request = new ConfirmEmailRequest { UserId = "1", Code = "123456" };

        // Act
        var result = await _controller.Confirm(request);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public async Task Confirm_EmailAlreadyConfirmed_ReturnsRedirect()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(true);

        var request = new ConfirmEmailRequest { UserId = "1", Code = "123456" };

        // Act
        var result = await _controller.Confirm(request);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        var redirect = (RedirectToActionResult)result;
        Assert.That(redirect.ActionName, Is.EqualTo("Index"));
    }

    [Test]
    public async Task Confirm_ConfirmEmailFails_ReturnsView()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", Email = "u@t.com" };
        _userManagerMock.Setup(u => u.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(u => u.IsEmailConfirmedAsync(user)).ReturnsAsync(false);
        _userManagerMock.Setup(u => u.GenerateEmailConfirmationTokenAsync(user)).ReturnsAsync("token");
        _userManagerMock.Setup(u => u.ConfirmEmailAsync(user, "token"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Confirm failed" }));

        _cache.Set("verify_code:1", "123456");

        var request = new ConfirmEmailRequest { UserId = "1", Code = "123456" };

        // Act
        var result = await _controller.Confirm(request);

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        var redirect = (RedirectToActionResult)result;
        Assert.That(redirect.ActionName, Is.EqualTo("Index"));
    }
}
