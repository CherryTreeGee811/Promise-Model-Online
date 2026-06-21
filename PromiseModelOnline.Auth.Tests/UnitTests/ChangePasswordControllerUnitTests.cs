using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.Models;
using System.Threading.Tasks;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="ChangePasswordController"/> covering password change with validation, logging, and token revocation.</summary>
// Requirements: REQ_USE_012
public class ChangePasswordControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IOpenIddictTokenManager> _tokenManagerMock = null!;
    private Mock<ILogger<ChangePasswordController>> _loggerMock = null!;
    private ChangePasswordController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _tokenManagerMock = new Mock<IOpenIddictTokenManager>();
        _loggerMock = new Mock<ILogger<ChangePasswordController>>();

        _controller = new ChangePasswordController(
            _userManagerMock.Object, _tokenManagerMock.Object, _loggerMock.Object);
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

    /// <summary>Set the HttpContext user with a Subject claim for the given user ID.</summary>
    /// <param name="userId">The user ID to set as the Subject claim.</param>
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
            CurrentPassword = "old",
            NewPassword = "new",
            ConfirmPassword = "new"
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
            CurrentPassword = "old",
            NewPassword = "new",
            ConfirmPassword = "different"
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
            CurrentPassword = "old",
            NewPassword = "new",
            ConfirmPassword = "new"
        });

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_InvalidCurrentPassword_ReturnsBadRequestAndLogsWarning()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "old")).ReturnsAsync(false);

        // Act
        var result = await _controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "old",
            NewPassword = "new",
            ConfirmPassword = "new"
        });

        // Assert
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        var bad = (BadRequestObjectResult)result;
        Assert.That(bad.Value, Is.EqualTo("Current password is incorrect."));
        _loggerMock.VerifyLog(LogLevel.Warning, "Invalid current password for user");
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_ChangeFails_ReturnsBadRequestAndLogsWarning()
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
            CurrentPassword = "old",
            NewPassword = "new",
            ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        var bad = (BadRequestObjectResult)result;
        Assert.That(bad.Value, Is.EqualTo("err1"));
        _loggerMock.VerifyLog(LogLevel.Warning, "ChangePassword failed for user");
    }

    [Test]
    public async Task REQ_USE_012_ChangePassword_Success_RevokesTokensAndReturnsOk()
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
            CurrentPassword = "old",
            NewPassword = "new",
            ConfirmPassword = "new"
        });

        Assert.That(result, Is.TypeOf<OkObjectResult>());
        _tokenManagerMock.Verify(x => x.TryRevokeAsync(It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
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

internal static class LoggerMockExtensions
{
    public static void VerifyLog<T>(this Mock<ILogger<T>> mock, LogLevel level, string contains)
    {
        mock.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(contains)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce());
    }
}
