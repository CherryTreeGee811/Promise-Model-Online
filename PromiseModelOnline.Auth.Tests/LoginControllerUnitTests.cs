namespace PromiseModelOnline.Auth.Tests
{
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Configuration;
    using Moq;
    using NUnit.Framework;
    using PromiseModelOnline.Auth.Controllers;
    using PromiseModelOnline.Auth.Data;
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
            _userManagerMock = new Mock<UserManager<IdentityUser>>(store.Object, null, null, null, null, null, null, null, null);

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
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        public async Task Login_NullUserLogin_ReturnsBadRequest()
        {
            // Act
            var result = await _loginController.Login(null);

            // Assert
            Assert.IsInstanceOf<BadRequestObjectResult>(result);
        }

        [Test]
        public async Task Login_InvalidUser_ReturnsUnauthorized()
        {
            // Arrange
            var userLogin = new UserLogin { UserName = "invalidUser", Password = "password" };
            _userManagerMock.Setup(x => x.FindByNameAsync(userLogin.UserName)).ReturnsAsync((IdentityUser)null);

            // Act
            var result = await _loginController.Login(userLogin);

            // Assert
            Assert.IsInstanceOf<UnauthorizedObjectResult>(result);
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
            Assert.IsInstanceOf<UnauthorizedObjectResult>(result);
        }

        [Test]
        public async Task Login_ValidUserValidPassword_ReturnsOk()
        {
            // Arrange
            var userLogin = new UserLogin { UserName = "testUser", Password = "correctPassword" };
            var identityUser = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock.Setup(x => x.FindByNameAsync(userLogin.UserName)).ReturnsAsync(identityUser);
            _userManagerMock.Setup(x => x.CheckPasswordAsync(identityUser, userLogin.Password)).ReturnsAsync(true);

            _configMock.SetupGet(x => x["Jwt:Key"]).Returns("my-super-secret-key-that-is-very-long");
            _configMock.SetupGet(x => x["Jwt:Issuer"]).Returns("issuer");
            _configMock.SetupGet(x => x["Jwt:Audience"]).Returns("audience");

            // Act
            var result = await _loginController.Login(userLogin) as OkObjectResult;

            // Assert
            Assert.IsNotNull(result);
            Assert.IsInstanceOf<TokenResponse>(result.Value);
            var tokenResponse = result.Value as TokenResponse;
            Assert.IsNotNull(tokenResponse.AccessToken);
            Assert.IsNotNull(tokenResponse.RefreshToken);
        }
    }
}
