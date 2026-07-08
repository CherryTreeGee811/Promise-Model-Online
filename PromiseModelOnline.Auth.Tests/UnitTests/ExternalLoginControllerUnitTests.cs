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
        _signInManagerMock.Setup(s => s.ConfigureExternalAuthenticationProperties("Google", It.IsAny<string>()))
            .Returns(new AuthenticationProperties());

        var result = _controller.Challenge("Google", "/");

        Assert.That(result, Is.InstanceOf<ChallengeResult>());
    }

    [Test]
    public void Challenge_EmptyProvider_ReturnsBadRequest()
    {
        var result = _controller.Challenge("", "/");

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Callback_RemoteError_RedirectsToLoginWithError()
    {
        var result = await _controller.Callback(remoteError: "access_denied");

        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
        var redirect = (RedirectToActionResult)result;
        Assert.That(redirect.ControllerName, Is.EqualTo("Login"));
    }

    [Test]
    public async Task Callback_NullExternalInfo_RedirectsToLogin()
    {
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync((ExternalLoginInfo?)null);

        var result = await _controller.Callback();

        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }

    [Test]
    public async Task Callback_ExternalSignInSucceeded_RedirectsToBff()
    {
        var info = new ExternalLoginInfo(new ClaimsPrincipal(), "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        var result = await _controller.Callback();

        Assert.That(result, Is.InstanceOf<RedirectResult>());
    }

    [Test]
    public async Task Callback_NoEmailClaim_RedirectsToLoginWithError()
    {
        var info = new ExternalLoginInfo(new ClaimsPrincipal(), "Google", "key", "display");
        _signInManagerMock.Setup(s => s.GetExternalLoginInfoAsync()).ReturnsAsync(info);
        _signInManagerMock.Setup(s => s.ExternalLoginSignInAsync("Google", "key", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        var result = await _controller.Callback();

        Assert.That(result, Is.InstanceOf<RedirectToActionResult>());
    }
}
