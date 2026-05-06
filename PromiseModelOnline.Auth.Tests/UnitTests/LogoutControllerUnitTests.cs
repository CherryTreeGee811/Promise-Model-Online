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

    public class LogoutControllerUnitTests
    {
        private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
        private AuthorizationDbContext _dbContext = null!;
        private LogoutController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var store = new Mock<IUserStore<IdentityUser>>();
            _userManagerMock = new Mock<UserManager<IdentityUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var options = new DbContextOptionsBuilder<AuthorizationDbContext>()
                .UseInMemoryDatabase($"LogoutControllerTests_{Guid.NewGuid()}")
                .Options;

            _dbContext = new AuthorizationDbContext(options);

            _controller = new LogoutController(_userManagerMock.Object, _dbContext)
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
        public async Task Logout_MissingNameIdClaim_ReturnsUnauthorized()
        {
            var result = await _controller.Logout(null);

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
            _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task Logout_UserNotFound_ReturnsUnauthorized()
        {
            SetNameIdUser("missing-user");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("missing-user"))
                .ReturnsAsync((IdentityUser?)null);

            var result = await _controller.Logout(null);

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task Logout_WithSpecificRefreshToken_RevokesOnlyThatToken()
        {
            SetNameIdUser("testUser");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(new IdentityUser { Id = "user1-id", UserName = "testUser" });

            _dbContext.RefreshTokens.AddRange(
                new RefreshToken
                {
                    Token = "token-a",
                    UserId = "user1-id",
                    Created = DateTime.UtcNow.AddDays(-1),
                    Expires = DateTime.UtcNow.AddDays(7),
                    IsRevoked = false
                },
                new RefreshToken
                {
                    Token = "token-b",
                    UserId = "user1-id",
                    Created = DateTime.UtcNow.AddDays(-1),
                    Expires = DateTime.UtcNow.AddDays(7),
                    IsRevoked = false
                });
            await _dbContext.SaveChangesAsync();

            var result = await _controller.Logout(new LogoutRequest { RefreshToken = "token-a" });

            Assert.That(result, Is.TypeOf<NoContentResult>());

            var tokens = await _dbContext.RefreshTokens.ToListAsync();
            Assert.That(tokens.Single(t => t.Token == "token-a").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "token-b").IsRevoked, Is.False);
        }

        [Test]
        public async Task Logout_WithSpecificRefreshToken_BelongsToDifferentUser_DoesNotRevokeAnything()
        {
            SetNameIdUser("testUser");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(new IdentityUser { Id = "user1-id", UserName = "testUser" });

            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = "other-users-token",
                UserId = "other-user-id",
                Created = DateTime.UtcNow.AddDays(-1),
                Expires = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            });
            await _dbContext.SaveChangesAsync();

            var result = await _controller.Logout(new LogoutRequest { RefreshToken = "other-users-token" });

            Assert.That(result, Is.TypeOf<NoContentResult>());

            var token = await _dbContext.RefreshTokens.SingleAsync();
            Assert.That(token.IsRevoked, Is.False);
        }

        [Test]
        public async Task Logout_NoRequest_RevokesAllActiveTokensForUserOnly()
        {
            SetNameIdUser("testUser");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(new IdentityUser { Id = "user1-id", UserName = "testUser" });

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
                    Token = "active-2",
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

            var result = await _controller.Logout(null);

            Assert.That(result, Is.TypeOf<NoContentResult>());

            var tokens = await _dbContext.RefreshTokens.ToListAsync();
            Assert.That(tokens.Single(t => t.Token == "active-1").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "active-2").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "expired").IsRevoked, Is.False);
            Assert.That(tokens.Single(t => t.Token == "already-revoked").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "other-user-active").IsRevoked, Is.False);
        }

        [Test]
        public async Task Logout_EmptyRefreshTokenInRequest_TreatedAsRevokeAllActive()
        {
            SetNameIdUser("testUser");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(new IdentityUser { Id = "user1-id", UserName = "testUser" });

            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = "active",
                UserId = "user1-id",
                Created = DateTime.UtcNow.AddDays(-1),
                Expires = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            });
            await _dbContext.SaveChangesAsync();

            var result = await _controller.Logout(new LogoutRequest { RefreshToken = "" });

            Assert.That(result, Is.TypeOf<NoContentResult>());

            var token = await _dbContext.RefreshTokens.SingleAsync();
            Assert.That(token.IsRevoked, Is.True);
        }
    }
}