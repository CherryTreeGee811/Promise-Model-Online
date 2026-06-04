using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.Models;
using System.Threading.Tasks;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace PromiseModelOnline.Auth.Tests;

public class ChangePasswordControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IOpenIddictTokenManager> _tokenManagerMock = null!;
    private ChangePasswordController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _tokenManagerMock = new Mock<IOpenIddictTokenManager>();

        _controller = new ChangePasswordController(_userManagerMock.Object, _tokenManagerMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        // By default, return empty token list
        _tokenManagerMock
            .Setup(x => x.FindAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(AsyncEnumerableFrom<object>());
    }

    private void SetSubjectUser(string userId)
    {
        var identity = new ClaimsIdentity(new[] { new Claim(Claims.Subject, userId) }, "TestAuth");
        _controller.ControllerContext.HttpContext!.User = new ClaimsPrincipal(identity);
    }

    [Test]
    public async Task ChangePassword_MissingSubjectClaim_ReturnsUnauthorized()
    {
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    public async Task ChangePassword_NullRequest_ReturnsBadRequest()
    {
        var result = await _controller.ChangePassword(null);
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task ChangePassword_PasswordMismatch_ReturnsBadRequest()
    {
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "different"
        });
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task ChangePassword_UserNotFound_ReturnsUnauthorized()
    {
        SetSubjectUser("ghost");
        _userManagerMock.Setup(x => x.FindByIdAsync("ghost")).ReturnsAsync((IdentityUser?)null);

        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    public async Task ChangePassword_InvalidCurrentPassword_ReturnsUnauthorizedObject()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(false);

        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });
        Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task ChangePassword_ChangeFails_ReturnsBadRequestWithErrors()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "err1" }));

        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        var bad = (BadRequestObjectResult)result;
        Assert.That(GetAnonymousProperty(bad.Value, "message"), Is.EqualTo("Could not change password"));
    }

    [Test]
    public async Task ChangePassword_Success_RevokesTokensAndReturnsNoContent()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Success);

        // Override default to return two tokens
        _tokenManagerMock
            .Setup(x => x.FindAsync(
                subject: "1",
                client: null,
                status: null,
                type: TokenTypeHints.RefreshToken,
                cancellationToken: It.IsAny<CancellationToken>()))
            .Returns(AsyncEnumerableFrom(new object(), new object()));

        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<NoContentResult>());
        _tokenManagerMock.Verify(x => x.TryRevokeAsync(It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    private static object? GetAnonymousProperty(object? obj, string propertyName)
    {
        if (obj == null) return null;
        var prop = obj.GetType().GetProperty(propertyName);
        return prop?.GetValue(obj);
    }

    private static async IAsyncEnumerable<T> AsyncEnumerableFrom<T>(params T[] items)
    {
        foreach (var item in items)
            yield return item;
    }
}