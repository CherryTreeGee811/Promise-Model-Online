using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.ViewModels;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.Extensions.Configuration;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="LoginController"/> covering authentication, lockout, and email verification.</summary>
// Requirements: REQ_FUN_002 REQ_NF_010
public class LoginControllerUnitTests
{
    private Mock<SignInManager<IdentityUser>> _signInManagerMock = null!;
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private LoginController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var userStore = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _signInManagerMock = new Mock<SignInManager<IdentityUser>>(
            _userManagerMock.Object,
            new Mock<IHttpContextAccessor>().Object,
            new Mock<IUserClaimsPrincipalFactory<IdentityUser>>().Object,
            null!, null!, null!, null!);

        // ✅ FIX: create controller
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Authentication:Google:ClientId"]).Returns((string?)null);

        _controller = new LoginController(
            _signInManagerMock.Object,
            _userManagerMock.Object,
            configMock.Object
        );

        var httpContext = new DefaultHttpContext();

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        _controller.Url = new UrlHelper(
            new ActionContext(
                httpContext,
                new RouteData(),
                new ActionDescriptor()
            )
        );
    }

    [TearDown]
    public void TearDown()
    {
        _controller.Dispose();
    }

        [Test]
        public void REQ_FUN_002_Index_Get_ReturnsViewWithViewModel()
        {
            // Act
            var result = _controller.Index(returnUrl: null);

            // Assert
            Assert.That(result, Is.TypeOf<ViewResult>());
            var view = (ViewResult)result;
        Assert.That(view.Model, Is.TypeOf<LoginViewModel>());
    }

    [Test]
    public async Task REQ_FUN_002_Index_Post_InvalidModelState_ReturnsViewWithErrors()
    {
        // Arrange
        _controller.ModelState.AddModelError("Username", "Required");
        var model = new LoginViewModel { Username = "", Password = "" };

        // Act
        var result = await _controller.Login(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_002_Index_Post_UserNotFound_ReturnsViewWithError()
    {
        // Arrange
        var model = new LoginViewModel { Username = "nobody", Password = "pw" };
        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("nobody", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        // Act
        var result = await _controller.Login(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Invalid credentials"));
    }

    [Test]
    public async Task REQ_FUN_002_Index_Post_LockedOut_ReturnsViewWithLockoutError()
    {
        // Arrange
        var model = new LoginViewModel { Username = "locked_user", Password = "pw" };
        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("locked_user", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

        // Act
        var result = await _controller.Login(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Does.Contain("locked").IgnoreCase);
    }

    [Test]
    public async Task REQ_FUN_002_Index_Post_ValidCredentials_RedirectsToReturnUrl()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw", ReturnUrl = "/home" };
        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("test", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);

        // Act
        var result = await _controller.Login(model);

        // Assert
        Assert.That(result, Is.TypeOf<RedirectResult>());
        Assert.That(((RedirectResult)result).Url, Is.EqualTo("/home"));
    }

    [Test]
    public async Task REQ_FUN_002_Index_Post_ValidCredentials_NoReturnUrl_RedirectsToBffLogin()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw" };
        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("test", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);

        // Act
        var result = await _controller.Login(model);

        // Assert
        Assert.That(result, Is.TypeOf<RedirectResult>());
        Assert.That(((RedirectResult)result).Url, Is.EqualTo("/login"));
    }

    [Test]
    public async Task REQ_FUN_002_Index_Post_NotEmailConfirmed_ReturnsViewWithError()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw" };
        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("test", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(false);

        // Act
        var result = await _controller.Login(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Does.Contain("verify").IgnoreCase);
    }
}