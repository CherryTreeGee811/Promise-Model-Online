using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Controllers;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="ChangePasswordPageController"/> covering the MVC change-password form.</summary>
// Requirements: REQ_USE_012 REQ-SEC-LOG-001
public class ChangePasswordPageControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IOpenIddictTokenManager> _tokenManagerMock = null!;
    private Mock<ILogger<ChangePasswordPageController>> _loggerMock = null!;
    private ChangePasswordPageController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _tokenManagerMock = new Mock<IOpenIddictTokenManager>();
        _loggerMock = new Mock<ILogger<ChangePasswordPageController>>();

        _controller = new ChangePasswordPageController(
            _userManagerMock.Object, _tokenManagerMock.Object, _loggerMock.Object);

        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        _tokenManagerMock
            .Setup(x => x.FindAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(AsyncEnumerableFrom<object>());
    }

    [TearDown]
    public void TearDown() => _controller.Dispose();

    /// <summary>Set the HttpContext user with a Subject claim for the given user ID.</summary>
    /// <param name="userId">The user ID to set as the Subject claim.</param>
    private void SetSubjectUser(string userId)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(OpenIddictConstants.Claims.Subject, userId),
            new Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId)
        }, "TestAuth");
        _controller.ControllerContext.HttpContext!.User = new ClaimsPrincipal(identity);
    }

    [Test]
    [Description("REQ_USE_012: GET returns the change-password view")]
    public void Index_Get_ReturnsView()
    {
        // Act
        var result = _controller.Index();

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
    }

    [Test]
    [Description("REQ_USE_012: Empty fields return view with validation error")]
    public async Task ChangePassword_AllFieldsEmpty_ReturnsViewWithError()
    {
        // Act
        var result = await _controller.ChangePassword(null, null, null);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("All fields are required."));
    }

    [Test]
    [Description("REQ_USE_012: Mismatched passwords return view with validation error")]
    public async Task ChangePassword_PasswordMismatch_ReturnsViewWithError()
    {
        // Act
        var result = await _controller.ChangePassword("old", "new1", "new2");

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("New password and confirmation must match."));
    }

    [Test]
    [Description("REQ_USE_012: Missing subject claim returns unauthorized")]
    public async Task ChangePassword_MissingSubject_ReturnsUnauthorized()
    {
        // Act — no user set, so Subject claim is missing
        var result = await _controller.ChangePassword("old", "new", "new");

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: User not found returns unauthorized and logs warning")]
    public async Task ChangePassword_UserNotFound_ReturnsUnauthorized()
    {
        // Arrange
        SetSubjectUser("ghost");
        _userManagerMock.Setup(x => x.FindByIdAsync("ghost")).ReturnsAsync((IdentityUser?)null);

        // Act
        var result = await _controller.ChangePassword("old", "new", "new");

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        _loggerMock.VerifyLog(LogLevel.Warning, "user not found");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Invalid current password returns view and logs warning")]
    public async Task ChangePassword_InvalidCurrentPassword_ReturnsViewWithError()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "wrong")).ReturnsAsync(false);

        // Act
        var result = await _controller.ChangePassword("wrong", "new", "new");

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Current password is incorrect."));
        _loggerMock.VerifyLog(LogLevel.Warning, "invalid current password");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Change failure returns view with errors and logs warning")]
    public async Task ChangePassword_ChangeFails_ReturnsViewWithErrors()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password too weak" }));

        // Act
        var result = await _controller.ChangePassword("old", "new", "new");

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Password too weak"));
        _loggerMock.VerifyLog(LogLevel.Warning, "failure for");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Successful change revokes tokens, sets ViewBag, logs info")]
    public async Task ChangePassword_Success_ReturnsViewWithSuccess()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Success);
        _tokenManagerMock
            .Setup(x => x.FindAsync(
                subject: "1",
                client: null,
                status: null,
                type: OpenIddictConstants.TokenTypeHints.RefreshToken,
                cancellationToken: It.IsAny<CancellationToken>()))
            .Returns(AsyncEnumerableFrom(new object(), new object()));

        // Act
        var result = await _controller.ChangePassword("old", "new", "new");

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ViewBag.Success, Is.True);
        _loggerMock.VerifyLog(LogLevel.Information, "password changed");
    }

    /// <summary>Create an async-enumerable sequence from a parameter array (for mocking IAsyncEnumerable{T} return values).</summary>
    /// <param name="items">The items to yield.</param>
    /// <typeparam name="T">The element type.</typeparam>
    private static async IAsyncEnumerable<T> AsyncEnumerableFrom<T>(params T[] items)
    {
        foreach (var item in items)
            yield return item;
    }
}
