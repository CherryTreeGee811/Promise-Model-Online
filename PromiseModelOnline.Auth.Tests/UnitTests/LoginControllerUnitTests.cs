namespace PromiseModelOnline.Auth.Tests
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
    }
}