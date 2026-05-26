using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.ViewModels;
using System.Threading.Tasks;
using OpenIddict.Server.AspNetCore;

namespace PromiseModelOnline.Auth.Tests;

public class AccountControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private AccountController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _controller = new AccountController(_userManagerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _controller.Dispose();
    }

    [Test]
    public void Register_Get_ReturnsViewWithViewModel()
    {
        var result = _controller.Register();

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(((ViewResult)result).Model, Is.TypeOf<RegisterViewModel>());
    }

    [Test]
    public async Task Register_Post_InvalidModel_ReturnsViewWithErrors()
    {
        _controller.ModelState.AddModelError("Username", "Required");
        var model = new RegisterViewModel { Username = "", Email = "", Password = "", ConfirmPassword = "" };

        var result = await _controller.Register(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task Register_Post_ExistingUsername_ReturnsViewWithError()
    {
        var model = new RegisterViewModel { Username = "existing", Email = "e@e.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("existing"))
            .ReturnsAsync(new IdentityUser { UserName = "existing" });

        var result = await _controller.Register(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[nameof(model.Username)]?.Errors[0].ErrorMessage,
            Is.EqualTo("Username is already taken."));
    }

    [Test]
    public async Task Register_Post_ExistingEmail_ReturnsViewWithError()
    {
        var model = new RegisterViewModel { Username = "new", Email = "taken@test.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("new")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.FindByEmailAsync("taken@test.com"))
            .ReturnsAsync(new IdentityUser { Email = "taken@test.com" });

        var result = await _controller.Register(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[nameof(model.Email)]?.Errors[0].ErrorMessage,
            Is.EqualTo("An account with this email already exists."));
    }

    [Test]
    public async Task Register_Post_CreateFails_ReturnsViewWithErrors()
    {
        var model = new RegisterViewModel { Username = "new", Email = "new@test.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("new")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.FindByEmailAsync("new@test.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<IdentityUser>(), "pw"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Error occurred." }));

        var result = await _controller.Register(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Error occurred."));
    }

    [Test]
    public async Task Register_Post_Success_RedirectsToLogin()
    {
        var model = new RegisterViewModel { Username = "new", Email = "new@test.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("new")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.FindByEmailAsync("new@test.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<IdentityUser>(), "pw"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _controller.Register(model);
        
        Assert.That(result, Is.TypeOf<RedirectResult>());

        var redirect = result as RedirectResult;
        Assert.That(redirect, Is.Not.Null);

        Assert.That(redirect!.Url, Does.StartWith("/connect/login"));
    }
}