<<<<<<< HEAD
﻿using Microsoft.AspNetCore.Http;
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
using Microsoft.Extensions.Configuration;

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
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Authentication:Google:ClientId"]).Returns((string?)null);

        _controller = new LoginController(
            _signInManagerMock.Object,
            _userManagerMock.Object,
            configMock.Object
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

        var result = await _controller.Login(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task Index_Post_UserNotFound_ReturnsViewWithError()
    {
        var model = new LoginViewModel { Username = "nobody", Password = "pw" };

        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("nobody", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        var result = await _controller.Login(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Is.EqualTo("Invalid credentials"));
    }

    [Test]
    public async Task Index_Post_LockedOut_ReturnsViewWithLockoutError()
    {
        var model = new LoginViewModel { Username = "locked_user", Password = "pw" };

        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("locked_user", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

        var result = await _controller.Login(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Does.Contain("locked").IgnoreCase);
    }

    [Test]
    public async Task Index_Post_ValidCredentials_RedirectsToReturnUrl()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw", ReturnUrl = "/home" };

        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("test", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);

        var result = await _controller.Login(model);

        Assert.That(result, Is.TypeOf<RedirectResult>());
        Assert.That(((RedirectResult)result).Url, Is.EqualTo("/home"));
    }

    [Test]
    public async Task Index_Post_ValidCredentials_NoReturnUrl_RedirectsToBffLogin()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw" };

        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("test", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(true);

        var result = await _controller.Login(model);

        Assert.That(result, Is.TypeOf<RedirectResult>());
        Assert.That(((RedirectResult)result).Url, Is.EqualTo("/login"));
    }

    [Test]
    public async Task Index_Post_NotEmailConfirmed_ReturnsViewWithError()
    {
        var user = new IdentityUser { Id = "1", UserName = "test" };
        var model = new LoginViewModel { Username = "test", Password = "pw" };

        _signInManagerMock
            .Setup(x => x.PasswordSignInAsync("test", "pw", false, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.FindByNameAsync("test")).ReturnsAsync(user);
        _userManagerMock.Setup(x => x.IsEmailConfirmedAsync(user)).ReturnsAsync(false);

        var result = await _controller.Login(model);

        Assert.That(result, Is.TypeOf<ViewResult>());
        Assert.That(_controller.ModelState[string.Empty]?.Errors[0].ErrorMessage,
            Does.Contain("verify").IgnoreCase);
||||||| 1bedf4f
=======
﻿namespace PromiseModelOnline.Auth.Tests
{
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Configuration;
    using Moq;
    using NUnit.Framework;
    using PromiseModelOnline.Auth.Controllers;
    using PromiseModelOnline.Auth.DAL;
    using PromiseModelOnline.Auth.Models;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;

    public class LoginControllerUnitTests
    {
        private Mock<IConfiguration> _configMock;
        private Mock<UserManager<IdentityUser>> _userManagerMock;
        private AuthorizationDbContext _dbContext;
        private LoginController _loginController;

        [SetUp]
        public void Setup()
        {
            _configMock = new Mock<IConfiguration>();
            
            var store = new Mock<IUserStore<IdentityUser>>();
            _userManagerMock = new Mock<UserManager<IdentityUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var options = new DbContextOptionsBuilder<AuthorizationDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase")
                .Options;
            _dbContext = new AuthorizationDbContext(options);

            _loginController = new LoginController(_configMock.Object, _userManagerMock.Object, _dbContext);
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [Test]
        public async Task Login_EmptyUsername_ReturnsBadRequest()
        {
            // Arrange
            var userLogin = new UserLogin { UserName = "", Password = "password" };

            // Act
            var result = await _loginController.Login(userLogin);

            // Assert
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Login_NullUserLogin_ReturnsBadRequest()
        {
            // Act
            var result = await _loginController.Login(null!);

            // Assert
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Login_InvalidUser_ReturnsUnauthorized()
        {
            // Arrange
            var userLogin = new UserLogin { UserName = "invalidUser", Password = "password" };
            _userManagerMock.Setup(x => x.FindByNameAsync(userLogin.UserName)).ReturnsAsync((IdentityUser?)null);

            // Act
            var result = await _loginController.Login(userLogin);

            // Assert
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Login_ValidUserInvalidPassword_ReturnsUnauthorized()
        {
            // Arrange
            var userLogin = new UserLogin { UserName = "testUser", Password = "wrongPassword" };
            var identityUser = new IdentityUser { UserName = "testUser" };
            _userManagerMock.Setup(x => x.FindByNameAsync(userLogin.UserName)).ReturnsAsync(identityUser);
            _userManagerMock.Setup(x => x.CheckPasswordAsync(identityUser, userLogin.Password)).ReturnsAsync(false);

            // Act
            var result = await _loginController.Login(userLogin);

            // Assert
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Login_ValidUserValidPassword_ReturnsOk()
        {
            // Arrange
            var userLogin = new UserLogin { UserName = "testUser", Password = "correctPassword" };
            var identityUser = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock.Setup(x => x.FindByNameAsync(userLogin.UserName)).ReturnsAsync(identityUser);
            _userManagerMock.Setup(x => x.CheckPasswordAsync(identityUser, userLogin.Password)).ReturnsAsync(true);

            _configMock.SetupGet(x => x["JwtSettings:Key"]).Returns("my-super-secret-key-that-is-very-long-and-32-bytes");
            _configMock.SetupGet(x => x["JwtSettings:Issuer"]).Returns("issuer");
            _configMock.SetupGet(x => x["JwtSettings:Audience"]).Returns("audience");

            // Act
            var result = await _loginController.Login(userLogin) as OkObjectResult;

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Value, Is.TypeOf<TokenResponse>());
            var tokenResponse = (TokenResponse)result.Value!;
            Assert.That(tokenResponse.AccessToken, Is.Not.Null);
            Assert.That(tokenResponse.RefreshToken, Is.Not.Null);
        }

        [Test]
        public async Task Refresh_NullRequest_ReturnsBadRequest()
        {
            var result = await _loginController.Refresh(null!);
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Refresh_EmptyRefreshToken_ReturnsBadRequest()
        {
            var result = await _loginController.Refresh(new RefreshRequest { RefreshToken = "" });
            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Refresh_UnknownRefreshToken_ReturnsUnauthorized()
        {
            var result = await _loginController.Refresh(new RefreshRequest { RefreshToken = "does-not-exist" });
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Refresh_RevokedRefreshToken_ReturnsUnauthorized()
        {
            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = "revoked-token",
                UserId = "user-id",
                Created = DateTime.UtcNow.AddDays(-1),
                Expires = DateTime.UtcNow.AddDays(29),
                IsRevoked = true,
            });
            await _dbContext.SaveChangesAsync();

            var result = await _loginController.Refresh(new RefreshRequest { RefreshToken = "revoked-token" });
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Refresh_ExpiredRefreshToken_ReturnsUnauthorized()
        {
            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = "expired-token",
                UserId = "user-id",
                Created = DateTime.UtcNow.AddDays(-40),
                Expires = DateTime.UtcNow.AddMinutes(-1),
                IsRevoked = false,
            });
            await _dbContext.SaveChangesAsync();

            var result = await _loginController.Refresh(new RefreshRequest { RefreshToken = "expired-token" });
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Refresh_ValidRefreshToken_UserNotFound_ReturnsUnauthorized()
        {
            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = "valid-token",
                UserId = "missing-user-id",
                Created = DateTime.UtcNow.AddDays(-1),
                Expires = DateTime.UtcNow.AddDays(29),
                IsRevoked = false,
            });
            await _dbContext.SaveChangesAsync();

            _userManagerMock
                .Setup(x => x.FindByIdAsync("missing-user-id"))
                .ReturnsAsync((IdentityUser?)null);

            var result = await _loginController.Refresh(new RefreshRequest { RefreshToken = "valid-token" });
            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task Refresh_ValidRefreshToken_ReturnsOk_RevokesOldAndStoresNew()
        {
            _configMock.SetupGet(x => x["JwtSettings:Key"]).Returns("my-super-secret-key-that-is-very-long-and-32-bytes");
            _configMock.SetupGet(x => x["JwtSettings:Issuer"]).Returns("issuer");
            _configMock.SetupGet(x => x["JwtSettings:Audience"]).Returns("audience");

            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = "old-refresh-token",
                UserId = "user1-id",
                Created = DateTime.UtcNow.AddDays(-1),
                Expires = DateTime.UtcNow.AddDays(29),
                IsRevoked = false,
            });
            await _dbContext.SaveChangesAsync();

            _userManagerMock
                .Setup(x => x.FindByIdAsync("user1-id"))
                .ReturnsAsync(new IdentityUser { Id = "user1-id", UserName = "testUser" });

            var actionResult = await _loginController.Refresh(new RefreshRequest { RefreshToken = "old-refresh-token" });

            Assert.That(actionResult, Is.TypeOf<OkObjectResult>());
            var ok = (OkObjectResult)actionResult;
            Assert.That(ok.Value, Is.TypeOf<TokenResponse>());
            var response = (TokenResponse)ok.Value!;

            Assert.That(response.AccessToken, Is.Not.Null);
            Assert.That(response.RefreshToken, Is.Not.Null);

            var tokens = await _dbContext.RefreshTokens.ToListAsync();
            Assert.That(tokens.Count, Is.EqualTo(2));
            Assert.That(tokens.Count(t => t.IsRevoked), Is.EqualTo(1));
            Assert.That(tokens.Count(t => !t.IsRevoked), Is.EqualTo(1));
            Assert.That(tokens.Any(t => t.Token == "old-refresh-token" && t.IsRevoked), Is.True);
            Assert.That(tokens.Any(t => t.Token == response.RefreshToken && !t.IsRevoked && t.UserId == "user1-id"), Is.True);
        }
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}