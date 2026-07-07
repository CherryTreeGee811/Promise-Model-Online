using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.ViewModels;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="ProfileController"/> covering profile viewing, display name updates, and authentication enforcement.</summary>
public class ProfileControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<ILogger<ProfileController>> _loggerMock = null!;
    private ProfileController _controller = null!;

    private static IdentityUser CreateTestUser() => new()
    {
        Id = "user-1",
        UserName = "testuser",
        Email = "test@example.com",
        EmailConfirmed = true
    };

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _loggerMock = new Mock<ILogger<ProfileController>>();
        _controller = new ProfileController(
            _userManagerMock.Object,
            _loggerMock.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [TearDown]
    public void TearDown() => _controller.Dispose();

    private void SetAuthenticatedUser(IdentityUser user)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(OpenIddictConstants.Claims.Subject, user.Id),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty)
        }, "TestAuth");
        _controller.ControllerContext.HttpContext!.User = new ClaimsPrincipal(identity);
    }

    [Test]
    public async Task Index_Authenticated_ReturnsViewWithProfileData()
    {
        var user = CreateTestUser();
        SetAuthenticatedUser(user);
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);

        var result = await _controller.Index();

        Assert.That(result, Is.TypeOf<ViewResult>());
        var viewResult = (ViewResult)result;
        var model = viewResult.Model as ProfileViewModel;
        Assert.That(model, Is.Not.Null);
        Assert.That(model!.Username, Is.EqualTo("testuser"));
        Assert.That(model.Email, Is.EqualTo("test@example.com"));
        Assert.That(model.EmailConfirmed, Is.True);
    }

    [Test]
    public async Task Index_Unauthenticated_ReturnsChallenge()
    {
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync((IdentityUser?)null);

        var result = await _controller.Index();

        Assert.That(result, Is.TypeOf<ChallengeResult>());
    }

    [Test]
    public async Task Update_NewUsername_UpdatesAndReturnsSuccess()
    {
        var user = CreateTestUser();
        SetAuthenticatedUser(user);
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.FindByNameAsync("newname")).ReturnsAsync((IdentityUser?)null);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<IdentityUser>())).ReturnsAsync(IdentityResult.Success);

        var model = new ProfileViewModel { Username = "newname", Email = "test@example.com", EmailConfirmed = true };
        var result = await _controller.Update(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Updated, Is.True);
        Assert.That(user.UserName, Is.EqualTo("newname"));
        _loggerMock.VerifyLog(LogLevel.Information, "updated display name");
    }

    [Test]
    public async Task Update_DuplicateUsername_ReturnsError()
    {
        var user = CreateTestUser();
        SetAuthenticatedUser(user);
        var otherUser = new IdentityUser { Id = "other-1", UserName = "takenname", Email = "other@example.com" };
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.FindByNameAsync("takenname")).ReturnsAsync(otherUser);

        var model = new ProfileViewModel { Username = "takenname", Email = "test@example.com", EmailConfirmed = true };
        var result = await _controller.Update(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[nameof(ProfileViewModel.Username)]?.Errors[0].ErrorMessage,
            Is.EqualTo("This display name is already taken."));
    }

    [Test]
    public async Task Update_SameUsername_ReturnsSuccessWithoutUpdating()
    {
        var user = CreateTestUser();
        SetAuthenticatedUser(user);
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync(user);

        var model = new ProfileViewModel { Username = "testuser", Email = "test@example.com", EmailConfirmed = true };
        var result = await _controller.Update(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Updated, Is.True);
        _userManagerMock.Verify(x => x.UpdateAsync(It.IsAny<IdentityUser>()), Times.Never);
    }

    [Test]
    public async Task Update_InvalidModel_ReturnsViewWithErrors()
    {
        var user = CreateTestUser();
        SetAuthenticatedUser(user);
        _controller.ModelState.AddModelError("Username", "Required");

        var result = await _controller.Update(new ProfileViewModel());

        Assert.That(result, Is.TypeOf<ViewResult>());
        _userManagerMock.Verify(x => x.UpdateAsync(It.IsAny<IdentityUser>()), Times.Never);
    }

    [Test]
    public async Task Update_Unauthenticated_ReturnsChallenge()
    {
        _userManagerMock.Setup(x => x.GetUserAsync(It.IsAny<ClaimsPrincipal>())).ReturnsAsync((IdentityUser?)null);

        var result = await _controller.Update(new ProfileViewModel());

        Assert.That(result, Is.TypeOf<ChallengeResult>());
    }
}
