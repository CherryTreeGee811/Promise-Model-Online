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

/// <summary>Unit tests for <see cref="DeleteAccountController"/> covering account deletion with password validation.</summary>
// Requirements: REQ_USE_012
public class DeleteAccountControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IOpenIddictTokenManager> _tokenManagerMock = null!;
    private Mock<ILogger<DeleteAccountController>> _loggerMock = null!;
    private DeleteAccountController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _tokenManagerMock = new Mock<IOpenIddictTokenManager>();
        _loggerMock = new Mock<ILogger<DeleteAccountController>>();

        _controller = new DeleteAccountController(
            _userManagerMock.Object, _tokenManagerMock.Object, _loggerMock.Object);
        _controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        // By default, return an empty token collection so revocation loop does nothing
        _tokenManagerMock
            .Setup(x => x.FindBySubjectAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
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
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Missing subject returns unauthorized, no log expected")]
    public async Task REQ_USE_012_DeleteAccount_MissingSubjectClaim_ReturnsUnauthorized()
    {
        // Act
        var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
    }

    [Test]
    [Description("REQ_USE_012: Null request returns bad request")]
    public async Task REQ_USE_012_DeleteAccount_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.DeleteAccount(null);

        // Assert
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Unknown user returns unauthorized and logs warning")]
    public async Task REQ_USE_012_DeleteAccount_UserNotFound_ReturnsUnauthorized()
    {
        // Arrange
        SetSubjectUser("ghost");
        _userManagerMock.Setup(x => x.FindByIdAsync("ghost")).ReturnsAsync((IdentityUser?)null);

        // Act
        var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        _loggerMock.VerifyLog(LogLevel.Warning, "user not found");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Invalid password returns unauthorized and logs warning")]
    public async Task REQ_USE_012_DeleteAccount_InvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "pw")).ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

        // Assert
        Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        _loggerMock.VerifyLog(LogLevel.Warning, "invalid password");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Delete failure returns bad request and logs error")]
    public async Task REQ_USE_012_DeleteAccount_DeleteFails_ReturnsBadRequestWithErrors()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "pw")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.DeleteAsync(user))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Cannot delete" }));

        // Act
        var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

        // Assert
        Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        var bad = (BadRequestObjectResult)result;
        Assert.That(GetAnonymousProperty(bad.Value, "message"), Is.EqualTo("Could not delete account"));
        _loggerMock.VerifyLog(LogLevel.Error, "deletion failed");
    }

    [Test]
    [Description("REQ_USE_012 + REQ-SEC-LOG-001: Successful deletion revokes tokens and logs info")]
    public async Task REQ_USE_012_DeleteAccount_Success_RevokesTokensAndDeletesUser()
    {
        // Arrange
        var user = new IdentityUser { Id = "1", UserName = "test" };
        SetSubjectUser("1");
        _userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.CheckPasswordAsync(user, "pw")).ReturnsAsync(true);
        _userManagerMock.Setup(x => x.DeleteAsync(user)).ReturnsAsync(IdentityResult.Success);
        _tokenManagerMock
            .Setup(x => x.FindBySubjectAsync("1", It.IsAny<CancellationToken>()))
            .Returns(AsyncEnumerableFrom(new object(), new object()));

        // Act
        var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

        // Assert
        Assert.That(result, Is.TypeOf<NoContentResult>());
        _userManagerMock.Verify(x => x.DeleteAsync(user), Times.Once);
        _tokenManagerMock.Verify(x => x.TryRevokeAsync(It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _loggerMock.VerifyLog(LogLevel.Information, "deleted successfully");
    }

    /// <summary>Extract a named property from an anonymous object via reflection.</summary>
    /// <param name="obj">The anonymous object.</param>
    /// <param name="propertyName">The property name to extract.</param>
    /// <returns>The property value, or null if not found.</returns>
    private static object? GetAnonymousProperty(object? obj, string propertyName)
    {
        if (obj == null) return null;
        var prop = obj.GetType().GetProperty(propertyName);
        return prop?.GetValue(obj);
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
