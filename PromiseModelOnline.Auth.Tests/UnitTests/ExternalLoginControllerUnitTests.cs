using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class ExternalLoginControllerUnitTests
{
    private Mock<SignInManager<IdentityUser>> _signInManagerMock = null!;
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<ILogger<ExternalLoginController>> _loggerMock = null!;
    private ExternalLoginController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        var userStore = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _signInManagerMock = new Mock<SignInManager<IdentityUser>>(
            _userManagerMock.Object,
            new Mock<IHttpContextAccessor>().Object,
            new Mock<IUserClaimsPrincipalFactory<IdentityUser>>().Object,
            null!, null!, null!, null!);

        _loggerMock = new Mock<ILogger<ExternalLoginController>>();

        _controller = new ExternalLoginController(
            _signInManagerMock.Object,
            _userManagerMock.Object,
            _loggerMock.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _controller.Url = new Mock<IUrlHelper>().Object;
    }

    [TearDown]
    public void TearDown() => _controller.Dispose();

    [Test]
    public void Challenge_ValidProvider_ReturnsChallengeResult()
    {
        // Arrange
        _signInManagerMock.Setup(s => s.ConfigureExternalAuthenticationProperties("Google", It.IsAny<string>()))
            .Returns(new AuthenticationProperties());

        // Act
        var result = _controller.Challenge("Google", "/");

        // Assert
        Assert.That(result, Is.InstanceOf<ChallengeResult>());
    }

    [Test]
    public void Challenge_EmptyProvider_ReturnsBadRequest()
    {
        // Arrange

        // Act
        var result = _controller.Challenge("", "/");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Callback_RemoteError_RedirectsToLoginWithError()
    {
        // Arrange

        // Act
        var result = await _controller.Callback(remoteError: "access_denied");

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        var redirect = (RedirectToActionResult)result;
        Assert.That(redirect.ControllerName, Is.EqualTo("Login"));
    }

    [Test]
    public async Task Callback_NullExternalInfo_RedirectsToLogin()
    {
        // Arrange
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync((ExternalLoginInfo?)null);

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }

    [Test]
    public async Task Callback_ExternalSignInSucceeded_RedirectsToBff()
    {
        // Arrange
        var info = new ExternalLoginInfo(new ClaimsPrincipal(), "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public async Task Callback_NoEmailClaim_RedirectsToLoginWithError()
    {
        // Arrange
        var info = new ExternalLoginInfo(new ClaimsPrincipal(), "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }

    [Test]
    public void Challenge_WhitespaceProvider_ReturnsBadRequest()
    {
        // Arrange

        // Act
        var result = _controller.Challenge(" ", "/");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Callback_UserNotFound_CreatesUser_AddLoginSucceeds()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Email, "user@example.com") }));
        var info = new ExternalLoginInfo(claimsPrincipal, "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);
        _userManagerMock.Setup(u => u.FindByEmailAsync("user@example.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(u => u.CreateAsync(It.Is<IdentityUser>(x => x.Email == "user@example.com")))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(u => u.AddLoginAsync(It.IsAny<IdentityUser>(), info))
            .ReturnsAsync(IdentityResult.Success);
        _signInManagerMock.Setup(s => s.SignInAsync(It.IsAny<IdentityUser>(), false, null))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public async Task Callback_UserNotFound_CreateUserFails()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Email, "user@example.com") }));
        var info = new ExternalLoginInfo(claimsPrincipal, "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);
        _userManagerMock.Setup(u => u.FindByEmailAsync("user@example.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(u => u.CreateAsync(It.Is<IdentityUser>(x => x.Email == "user@example.com")))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Create failed" }));

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }

    [Test]
    public async Task Callback_UserNotFound_AddLoginFails()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Email, "user@example.com") }));
        var info = new ExternalLoginInfo(claimsPrincipal, "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);
        _userManagerMock.Setup(u => u.FindByEmailAsync("user@example.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(u => u.CreateAsync(It.Is<IdentityUser>(x => x.Email == "user@example.com")))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(u => u.AddLoginAsync(It.IsAny<IdentityUser>(), info))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "AddLogin failed" }));

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }

    [Test]
    public async Task Callback_ExistingUser_AddLoginFails()
    {
        // Arrange
        var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Email, "user@example.com") }));
        var info = new ExternalLoginInfo(claimsPrincipal, "Google", "key", "display");
        var existingUser = new IdentityUser { Id = "1", Email = "user@example.com" };
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);
        _userManagerMock.Setup(u => u.FindByEmailAsync("user@example.com")).ReturnsAsync(existingUser);
        _userManagerMock.Setup(u => u.AddLoginAsync(existingUser, info))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "AddLogin failed" }));

        // Act
        var result = await _controller.Callback();

        // Assert
        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }
}
