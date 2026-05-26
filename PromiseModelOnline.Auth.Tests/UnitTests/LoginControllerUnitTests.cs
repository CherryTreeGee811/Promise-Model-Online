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

namespace PromiseModelOnline.Auth.Tests;

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
        _controller = new LoginController(
            _signInManagerMock.Object,
            _userManagerMock.Object
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
    public void Index_Get_ReturnsViewWithViewModel()
    {
        var result = _controller.Index(returnUrl: null);

        Assert.That(result, Is.TypeOf<ViewResult>());
        var view = (ViewResult)result;
        Assert.That(view.Model, Is.TypeOf<LoginViewModel>());
    }

    [Test]
    public async Task Index_Post_InvalidModelState_ReturnsViewWithErrors()
    {
        _controller.ModelState.AddModelError("Username", "Required");
        var model = new LoginViewModel { Username = "", Password = "" };

        var result = await _controller.Index(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task Index_Post_UserNotFound_ReturnsViewWithError()
    {
        var model = new LoginViewModel { Username = "nobody", Password = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("nobody")).ReturnsAsync((IdentityUser?)null);

        var result = await _controller.Index(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Invalid username or password."));
    }

    [Test]
    public async Task Index_Post_ValidCredentials_RedirectsToReturnUrl()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw", ReturnUrl = "/home" };

        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync(user, "pw", false, false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        var result = await _controller.Index(model);

        Assert.That(result, Is.TypeOf<LocalRedirectResult>());
        Assert.That(((LocalRedirectResult)result).Url, Is.EqualTo("/home"));
    }

    [Test]
    public async Task Index_Post_ValidCredentials_NoReturnUrl_RedirectsToSlash()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw" };

        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _signInManagerMock.Setup(x => x.PasswordSignInAsync(user, "pw", false, false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

        var result = await _controller.Index(model);

        Assert.That(result, Is.TypeOf<RedirectResult>());
        Assert.That(((RedirectResult)result).Url, Is.EqualTo("/"));
    }
}