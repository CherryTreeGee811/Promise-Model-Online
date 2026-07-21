using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Controllers;
using PromiseModelOnline.Auth.ViewModels;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

/// <summary>Unit tests for <see cref="ResetPasswordController"/> covering token validation, password update, and error handling.</summary>
public class ResetPasswordControllerUnitTests
{
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<ILogger<ResetPasswordController>> _loggerMock = null!;
    private ResetPasswordController _controller = null!;

    [SetUp]
    public void Setup()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _loggerMock = new Mock<ILogger<ResetPasswordController>>();
        _controller = new ResetPasswordController(
            _userManagerMock.Object,
            _loggerMock.Object);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [TearDown]
    public void TearDown() => _controller.Dispose();

    [Test]
    public void Index_ValidTokenAndEmail_ReturnsViewWithPrepopulatedViewModel()
    {
        // Arrange

        // Act
        var result = _controller.Index("user@example.com", "valid-token");

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        var viewResult = (ViewResult)result;
        var model = viewResult.Model as ResetPasswordViewModel;
        Assert.That(model, Is.Not.Null);
        Assert.That(model!.Email, Is.EqualTo("user@example.com"));
        Assert.That(model.Token, Is.EqualTo("valid-token"));
    }

    [Test]
    public void Index_MissingToken_ReturnsErrorView()
    {
        // Arrange

        // Act
        var result = _controller.Index("user@example.com", null);

        // Assert
        var viewResult = result as ViewResult;
        Assert.That(viewResult, Is.Not.Null);
        Assert.That(viewResult!.ViewName, Is.EqualTo("Error"));
    }

    [Test]
    public void Index_MissingEmail_ReturnsErrorView()
    {
        // Arrange

        // Act
        var result = _controller.Index(null, "valid-token");

        // Assert
        var viewResult = result as ViewResult;
        Assert.That(viewResult, Is.Not.Null);
        Assert.That(viewResult!.ViewName, Is.EqualTo("Error"));
    }

    [Test]
    public async Task Reset_ValidToken_ResetsPasswordAndReturnsSuccessView()
    {
        // Arrange
        var model = new ResetPasswordViewModel
        {
            Email = "user@example.com",
            Token = "valid-token",
            Password = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };
        var user = new IdentityUser { Id = "1", Email = "user@example.com" };
        _userManagerMock.Setup(x => x.FindByEmailAsync("user@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.ResetPasswordAsync(user, "valid-token", "NewPass123!")).ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _controller.Reset(model);

        // Assert
        var viewResult = result as ViewResult;
        Assert.That(viewResult, Is.Not.Null);
        Assert.That(viewResult!.ViewName, Is.EqualTo("Success"));
        _loggerMock.VerifyLog(LogLevel.Information, "Password reset successful");
    }

    [Test]
    public async Task Reset_InvalidToken_ReturnsViewWithErrors()
    {
        // Arrange
        var model = new ResetPasswordViewModel
        {
            Email = "user@example.com",
            Token = "expired-token",
            Password = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };
        var user = new IdentityUser { Id = "1", Email = "user@example.com" };
        _userManagerMock.Setup(x => x.FindByEmailAsync("user@example.com")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.ResetPasswordAsync(user, "expired-token", "NewPass123!"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Invalid token." }));

        // Act
        var result = await _controller.Reset(model);

        // Assert
        var viewResult = result as ViewResult;
        Assert.That(viewResult, Is.Not.Null);
        Assert.That(viewResult!.ViewName, Is.Null.Or.EqualTo("Index"));
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage, Is.EqualTo("Invalid token."));
    }

    [Test]
    public async Task Reset_PasswordMismatch_ReturnsViewWithValidationError()
    {
        // Arrange
        var model = new ResetPasswordViewModel
        {
            Email = "user@example.com",
            Token = "valid-token",
            Password = "NewPass123!",
            ConfirmPassword = "DifferentPass!"
        };

        // Act
        var result = await _controller.Reset(model);

        // Assert
        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState.IsValid, Is.False);
    }

    [Test]
    public async Task Reset_UnknownEmail_ReturnsViewWithModelError()
    {
        // Arrange
        var model = new ResetPasswordViewModel
        {
            Email = "unknown@example.com",
            Token = "some-token",
            Password = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };
        _userManagerMock.Setup(x => x.FindByEmailAsync("unknown@example.com")).ReturnsAsync((IdentityUser?)null);

        // Act
        var result = await _controller.Reset(model);

        // Assert
        var viewResult = result as ViewResult;
        Assert.That(viewResult, Is.Not.Null);
        Assert.That(viewResult!.ViewName, Is.Null.Or.EqualTo("Index"));
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage, Is.EqualTo("Invalid password reset request."));
    }
}
