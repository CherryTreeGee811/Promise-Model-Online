<<<<<<< HEAD
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
||||||| 1bedf4f
=======
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

    public class ChangePasswordControllerUnitTests
    {
        private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
        private AuthorizationDbContext _dbContext = null!;
        private ChangePasswordController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var store = new Mock<IUserStore<IdentityUser>>();
            _userManagerMock = new Mock<UserManager<IdentityUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            var options = new DbContextOptionsBuilder<AuthorizationDbContext>()
                .UseInMemoryDatabase($"ChangePasswordControllerTests_{Guid.NewGuid()}")
                .Options;

            _dbContext = new AuthorizationDbContext(options);

            _controller = new ChangePasswordController(_userManagerMock.Object, _dbContext)
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
        public async Task ChangePassword_MissingNameIdClaim_ReturnsUnauthorized()
        {
            var result = await _controller.ChangePassword(new ChangePasswordRequest
            {
                CurrentPassword = "old",
                NewPassword = "new",
                ConfirmPassword = "new",
            });

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
            _userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
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
                CurrentPassword = "old",
                NewPassword = "new",
                ConfirmPassword = "different",
            });

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ChangePassword_UserNotFound_ReturnsUnauthorized()
        {
            SetNameIdUser("missing-user");
            _userManagerMock
                .Setup(x => x.FindByNameAsync("missing-user"))
                .ReturnsAsync((IdentityUser?)null);

            var result = await _controller.ChangePassword(new ChangePasswordRequest
            {
                CurrentPassword = "old",
                NewPassword = "new",
                ConfirmPassword = "new",
            });

            Assert.That(result, Is.TypeOf<UnauthorizedResult>());
        }

        [Test]
        public async Task ChangePassword_InvalidCurrentPassword_ReturnsUnauthorized()
        {
            SetNameIdUser("testUser");
            var user = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(user);

            _userManagerMock
                .Setup(x => x.CheckPasswordAsync(user, "old"))
                .ReturnsAsync(false);

            var result = await _controller.ChangePassword(new ChangePasswordRequest
            {
                CurrentPassword = "old",
                NewPassword = "new",
                ConfirmPassword = "new",
            });

            Assert.That(result, Is.TypeOf<UnauthorizedObjectResult>());
        }

        [Test]
        public async Task ChangePassword_ChangeFails_ReturnsBadRequestWithErrors()
        {
            SetNameIdUser("testUser");
            var user = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(user);

            _userManagerMock
                .Setup(x => x.CheckPasswordAsync(user, "old"))
                .ReturnsAsync(true);

            _userManagerMock
                .Setup(x => x.ChangePasswordAsync(user, "old", "new"))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "err1" }));

            var result = await _controller.ChangePassword(new ChangePasswordRequest
            {
                CurrentPassword = "old",
                NewPassword = "new",
                ConfirmPassword = "new",
            });

            Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
            var bad = (BadRequestObjectResult)result;
            Assert.That(GetAnonymousProperty(bad.Value, "message"), Is.EqualTo("Could not change password"));
            var errors = GetAnonymousProperty(bad.Value, "errors") as string;
            Assert.That(errors, Does.Contain("err1"));
        }

        [Test]
        public async Task ChangePassword_Success_RevokesAllActiveRefreshTokensForUserOnly()
        {
            SetNameIdUser("testUser");
            var user = new IdentityUser { Id = "user1-id", UserName = "testUser" };

            _userManagerMock
                .Setup(x => x.FindByNameAsync("testUser"))
                .ReturnsAsync(user);

            _userManagerMock
                .Setup(x => x.CheckPasswordAsync(user, "old"))
                .ReturnsAsync(true);

            _userManagerMock
                .Setup(x => x.ChangePasswordAsync(user, "old", "new"))
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

            var result = await _controller.ChangePassword(new ChangePasswordRequest
            {
                CurrentPassword = "old",
                NewPassword = "new",
                ConfirmPassword = "new",
            });

            Assert.That(result, Is.TypeOf<NoContentResult>());

            var tokens = await _dbContext.RefreshTokens.ToListAsync();
            Assert.That(tokens.Single(t => t.Token == "active-1").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "active-2").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "expired").IsRevoked, Is.False);
            Assert.That(tokens.Single(t => t.Token == "already-revoked").IsRevoked, Is.True);
            Assert.That(tokens.Single(t => t.Token == "other-user-active").IsRevoked, Is.False);

            _userManagerMock.Verify(x => x.ChangePasswordAsync(user, "old", "new"), Times.Once);
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
