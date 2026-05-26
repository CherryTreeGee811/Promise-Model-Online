using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace PromiseModelOnline.Api.Tests
{
    public class ReactionsControllerUnitTests
    {
        private Mock<IReactionService> _mockReactionService = null!;
        private Mock<IUserRepository> _mockUserRepository = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;
        private Mock<IHubContext<NotificationHub>> _mockHub = null!;

        private ReactionsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockReactionService = new Mock<IReactionService>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();
            _mockHub = new Mock<IHubContext<NotificationHub>>();
        }


        private void SetupUser()
        {
            var user = new User { Id = 1 };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()))
                .ReturnsAsync(user);

            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, "user@test.com"),
                new Claim("nameid", "tester")
            }, "test");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        private void InitControllerWithUser(string? email)
        {
            _controller = new ReactionsController(
                _mockReactionService.Object,
                _mockUserRepository.Object,
                NullLogger<ReactionsController>.Instance,
                _mockPermissionService.Object,
                 _mockHub.Object
            );

            var claims = new List<Claim>();

            if (email != null)
                claims.Add(new Claim(ClaimTypes.Email, email));

            var identity = new ClaimsIdentity(claims, "test");

            // ✅ ALWAYS setup permission
            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<PermissionLevel>()))
                .ReturnsAsync(true);

            // ✅ IMPORTANT: setup user repository
            if (email != null)
            {
                _mockUserRepository
                    .Setup(r => r.GetOrCreateUserByEmailAsync(
                        email,
                        It.IsAny<string?>()))
                    .ReturnsAsync(new User { Id = 1, Email = email });
            }

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        // ✅ GET

        [Test]
        public async Task GetReactions_ReturnsOk()
        {
            var reactions = new List<ReactionDTO>
            {
                new ReactionDTO { Id = 1 }
            };

            _mockReactionService
                .Setup(s => s.GetReactionsAsync("Promise", 42))
                .ReturnsAsync(reactions);

            InitControllerWithUser("user@example.com");

            var result = await _controller.GetReactions("Promise", 42);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // ✅ CREATE

        [Test]
        public async Task CreateReaction_ReturnsCreated()
        {
            var request = new CreateReactionRequest
            {
                StackItemType = "Promise",
                StackItemId = 42,
                Emote = "thumbs-up"
            };

            var user = new User { Id = 1 };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string?>()))
                .ReturnsAsync(user);

            _mockReactionService
                .Setup(s => s.CreateReactionAsync(request, user.Id))
                .ReturnsAsync(new ReactionDTO());

            InitControllerWithUser("user@example.com");

            var result = await _controller.CreateReaction(request);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreateReaction_WithoutUser_ReturnsUnauthorized()
        {
            InitControllerWithUser(null);

            var result = await _controller.CreateReaction(new CreateReactionRequest());

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        // ✅ DELETE

        [Test]
        public async Task DeleteReaction_ReturnsNoContent()
        {
            var user = new User { Id = 1 };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string?>()))
                .ReturnsAsync(user);

            InitControllerWithUser("user@example.com");

            var result = await _controller.DeleteReaction(5);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task DeleteReaction_WithoutUser_ReturnsUnauthorized()
        {
            InitControllerWithUser(null);

            var result = await _controller.DeleteReaction(5);

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
        }
    }
}