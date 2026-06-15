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

/// <summary>Unit tests for <see cref="ChangePasswordController"/> covering password change with validation and token revocation.</summary>
// Requirements: REQ_USE_012
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
    public async Task REQ_USE_012_ChangePassword_MissingSubjectClaim_ReturnsUnauthorized()
    {
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ChangePassword(null);

        // Assert
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_PasswordMismatch_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "different"
        });

        // Assert
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_UserNotFound_ReturnsUnauthorized()
    {
        // Arrange
        SetSubjectUser("ghost");
        _userManagerMock.Setup(x => x.FindByIdAsync("ghost")).ReturnsAsync((IdentityUser?)null);

        // Act
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_InvalidCurrentPassword_ReturnsUnauthorizedObject()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(false);

        // Act
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_ChangeFails_ReturnsBadRequestWithErrors()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "err1" }));

        // Act
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old", NewPassword = "new", ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        var bad = (BadRequestObjectResult)result;
        Assert.That(GetAnonymousProperty(bad.Value, "message"), Is.EqualTo("Could not change password"));
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_Success_RevokesTokensAndReturnsNoContent()
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
                type: TokenTypeHints.RefreshToken,
                cancellationToken: It.IsAny<CancellationToken>()))
            .Returns(AsyncEnumerableFrom(new object(), new object()));

        // Act
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