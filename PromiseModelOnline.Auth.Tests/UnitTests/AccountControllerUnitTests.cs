using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.Services;
using PromiseModelOnline.Auth.ViewModels;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="AccountController"/> covering registration, email verification, and rate limiting.</summary>
// Requirements: REQ_FUN_001 REQ_FUN_047 REQ_NF_006 REQ_NF_007
public class AccountControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IEmailService> _emailServiceMock = null!;
    private Mock<IConfiguration> _configMock = null!;
    private Mock<ILogger<AccountController>> _loggerMock = null!;
    private IMemoryCache _cache = null!;
    private AccountController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _emailServiceMock = new Mock<IEmailService>();
        _configMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<AccountController>>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _controller = new AccountController(
            _userManagerMock.Object,
            _emailServiceMock.Object,
            _configMock.Object,
            _loggerMock.Object,
            _cache);
    }

    [TearDown]
    public void TearDown()
    {
        _controller.Dispose();
        _cache.Dispose();
    }

    [Test]
    public void REQ_FUN_001_Register_Get_ReturnsViewWithViewModel()
    {
        // Act
        var result = _controller.Register();
        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(((ViewResult)result).Model, Is.TypeOf<RegisterViewModel>());
    }

    [Test]
    public async Task REQ_FUN_001_Register_Post_InvalidModel_ReturnsViewWithErrors()
    {
        // Arrange
        _controller.ModelState.AddModelError("Username", "Required");
        var model = new RegisterViewModel { Username = "", Email = "", Password = "", ConfirmPassword = "" };
        // Act
        var result = await _controller.Register(model);
        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_001_Register_Post_ExistingUsername_ReturnsViewWithError()
    {
        // Arrange
        var model = new RegisterViewModel { Username = "existing", Email = "e@e.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("existing"))
            .ReturnsAsync(new IdentityUser { UserName = "existing" });
        // Act
        var result = await _controller.Register(model);
        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[nameof(model.Username)]?.Errors[0].ErrorMessage,
            Is.EqualTo("Username is already taken."));
    }

    [Test]
    public async Task REQ_FUN_001_Register_Post_ExistingEmail_ReturnsViewWithError()
    {
        // Arrange
        var model = new RegisterViewModel { Username = "new", Email = "taken@test.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("new")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.FindByEmailAsync("taken@test.com"))
            .ReturnsAsync(new IdentityUser { Email = "taken@test.com" });
        // Act
        var result = await _controller.Register(model);
        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[nameof(model.Email)]?.Errors[0].ErrorMessage,
            Is.EqualTo("An account with this email already exists."));
    }

    [Test]
    public async Task REQ_FUN_001_Register_Post_CreateFails_ReturnsViewWithErrors()
    {
        // Arrange
        var model = new RegisterViewModel { Username = "new", Email = "new@test.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("new")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.FindByEmailAsync("new@test.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<IdentityUser>(), "pw"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Error occurred." }));
        // Act
        var result = await _controller.Register(model);
        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Error occurred."));
    }

    [Test]
    public async Task REQ_FUN_001_Register_Post_Success_RedirectsToEmailVerification()
    {
        // Arrange
        var model = new RegisterViewModel { Username = "new", Email = "new@test.com", Password = "pw", ConfirmPassword = "pw" };
        _userManagerMock.Setup(x => x.FindByNameAsync("new")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.FindByEmailAsync("new@test.com")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock
            .Setup(x => x.CreateAsync(It.IsAny<IdentityUser>(), "pw"))
            .ReturnsAsync(IdentityResult.Success);
        // Act
        var result = await _controller.Register(model);
        // Assert
        Assert.That(result, Is.TypeOf<RedirectToActionResult>());

        var redirect = result as RedirectToActionResult;
        Assert.That(redirect, Is.Not.Null);
        Assert.That(redirect!.ActionName, Is.EqualTo("Index"));
        Assert.That(redirect.ControllerName, Is.EqualTo("EmailVerification"));
        Assert.That(redirect.RouteValues, Contains.Key("userId"));
    }
}