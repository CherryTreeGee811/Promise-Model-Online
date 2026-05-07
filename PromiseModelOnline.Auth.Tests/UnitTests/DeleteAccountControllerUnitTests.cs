namespace PromiseModelOnline.Auth.Tests
{
    using System;
    using System.Linq;
    using System.Security.Claims;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using Moq;
    using NUnit.Framework;
    using PromiseModelOnline.Auth.Controllers;
    using PromiseModelOnline.Auth.DAL;
    using PromiseModelOnline.Auth.Models;
    using System.IdentityModel.Tokens.Jwt;

    public class DeleteAccountControllerUnitTests
    {
        private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
        private AuthorizationDbContext _dbContext = null!;
        private DeleteAccountController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var store = new Mock<IUserStore<IdentityUser>>();
            _userManagerMock = new Mock<UserManager<IdentityUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var options = new DbContextOptionsBuilder<AuthorizationDbContext>()
                .UseInMemoryDatabase($"DeleteAccountControllerTests_{Guid.NewGuid()}")
                .Options;

            _dbContext = new AuthorizationDbContext(options);

            _controller = new DeleteAccountController(_userManagerMock.Object, _dbContext)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
        }

        [TearDown]
        public void TearDown()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private void SetNameIdUser(string userName)
        {
            var identity = new ClaimsIdentity(
                new[] { new Claim(JwtRegisteredClaimNames.NameId, userName) },
                "TestAuth");

            _controller.ControllerContext.HttpContext!.User = new ClaimsPrincipal(identity);
        }

        [Test]
        public async Task DeleteAccount_MissingNameIdClaim_ReturnsUnauthorized()
        {
            var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
            _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task DeleteAccount_NullRequest_ReturnsBadRequest()
        {
            var result = await _controller.DeleteAccount(null);

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task DeleteAccount_UserNotFound_ReturnsUnauthorized()
        {
            SetNameIdUser("missing-user");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("missing-user"))
                .ReturnsAsync((IdentityUser?)null);

            var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task DeleteAccount_InvalidPassword_ReturnsUnauthorized()
        {
            SetNameIdUser("testUser");
            var user = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(user);

            _userManagerMock
                .Setup(x => x.CheckPasswordAsync(user, "pw"))
                .ReturnsAsync(false);

            var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task DeleteAccount_DeleteFails_ReturnsBadRequestWithErrors()
        {
            SetNameIdUser("testUser");
            var user = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(user);

            _userManagerMock
                .Setup(x => x.CheckPasswordAsync(user, "pw"))
                .ReturnsAsync(true);

            _userManagerMock
                .Setup(x => x.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "err1" }));

            var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
            var bad = (BadRequestObjectResult)result;
            Assert.That(GetAnonymousProperty(bad.Value, "message"), Is.EqualTo("Could not delete account"));
            var errors = GetAnonymousProperty(bad.Value, "errors") as string;
            Assert.That(errors, Does.Contain("err1"));
        }

        [Test]
        public async Task DeleteAccount_Success_RevokesAllActiveRefreshTokensForUserOnly()
        {
            SetNameIdUser("testUser");
            var user = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(user);

            _userManagerMock
                .Setup(x => x.CheckPasswordAsync(user, "pw"))
                .ReturnsAsync(true);

            _userManagerMock
                .Setup(x => x.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            _dbContext.RefreshTokens.AddRange(
                new RefreshToken
                {
                    Token = "active-1",
                    UserId = "user1-id",
                    Created = DateTime.UtcNow.AddDays(-1),
                    Expires = DateTime.UtcNow.AddDays(7),
                    IsRevoked = false
                },
                new RefreshToken
                {
                    Token = "expired",
                    UserId = "user1-id",
                    Created = DateTime.UtcNow.AddDays(-30),
                    Expires = DateTime.UtcNow.AddMinutes(-1),
                    IsRevoked = false
                },
                new RefreshToken
                {
                    Token = "already-revoked",
                    UserId = "user1-id",
                    Created = DateTime.UtcNow.AddDays(-2),
                    Expires = DateTime.UtcNow.AddDays(7),
                    IsRevoked = true
                },
                new RefreshToken
                {
                    Token = "other-user-active",
                    UserId = "other-user-id",
                    Created = DateTime.UtcNow.AddDays(-1),
                    Expires = DateTime.UtcNow.AddDays(7),
                    IsRevoked = false
                });
            await _dbContext.SaveChangesAsync();

            var result = await _controller.DeleteAccount(new DeleteAccountRequest { Password = "pw" });

            Assert.That(result, Is.TypeOf<NoContentResult>());

            var tokens = await _dbContext.RefreshTokens.ToListAsync();
            Assert.That(tokens.Single(t => t.Token == "active-1").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "expired").IsRevoked, Is.False);
            Assert.That(tokens.Single(t => t.Token == "already-revoked").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "other-user-active").IsRevoked, Is.False);

            _userManagerMock.Verify(x => x.DeleteAsync(user), Times.Once);
        }

        private static object? GetAnonymousProperty(object? obj, string propertyName)
        {
            if (obj == null)
            {
                return null;
            }

            var type = obj.GetType();
            var prop = type.GetProperty(propertyName, System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.IgnoreCase);
            return prop?.GetValue(obj);
        }
    }
}
