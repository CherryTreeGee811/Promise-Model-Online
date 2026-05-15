using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class ReactionsControllerUnitTests
    {
        private Mock<IReactionService> _reactionServiceMock = null!;
        private Mock<IUserRepository> _userRepositoryMock = null!;
        private ReactionsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _reactionServiceMock = new Mock<IReactionService>();
            _userRepositoryMock = new Mock<IUserRepository>();
        }

        private void InitControllerWithUser(string? email, string? nameid = null)
        {
            _controller = new ReactionsController(_reactionServiceMock.Object, _userRepositoryMock.Object);

            var claims = new List<Claim>();
            if (email is not null)
            {
                claims.Add(new Claim(ClaimTypes.Email, email));
            }

            if (nameid is not null)
            {
                claims.Add(new Claim("nameid", nameid));
            }

            var identity = new ClaimsIdentity(claims, "test");
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        [Test]
        public async Task GetReactions_WithValidQuery_ReturnsOkWithReactions()
        {
            var reactions = new List<ReactionDTO>
            {
                new ReactionDTO
                {
                    Id = 1,
                    UserId = 10,
                    UserName = "User One",
                    Emote = "thumbs-up",
                    StackItemType = "Promise",
                    StackItemId = 42,
                    CreatedAt = System.DateTime.UtcNow
                },
                new ReactionDTO
                {
                    Id = 2,
                    UserId = 11,
                    UserName = "User Two",
                    Emote = "heart",
                    StackItemType = "Promise",
                    StackItemId = 42,
                    CreatedAt = System.DateTime.UtcNow
                }
            };

            _reactionServiceMock.Setup(s => s.GetReactionsAsync("Promise", 42))
                .ReturnsAsync(reactions);

            InitControllerWithUser("user@example.com");

            var result = await _controller.GetReactions("Promise", 42);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(reactions));
            _reactionServiceMock.Verify(s => s.GetReactionsAsync("Promise", 42), Times.Once);
        }

        [Test]
        public async Task UpsertReaction_WithAuthenticatedUser_ReturnsOkWithReaction()
        {
            var request = new CreateReactionRequest
            {
                Emote = "thumbs-up",
                StackItemType = "Promise",
                StackItemId = 42
            };

            var currentUser = new User { Id = 5, Email = "user@example.com", Name = "User" };
            var createdReaction = new ReactionDTO
            {
                Id = 100,
                UserId = currentUser.Id,
                UserName = currentUser.Name,
                Emote = request.Emote,
                StackItemType = request.StackItemType,
                StackItemId = request.StackItemId,
                CreatedAt = System.DateTime.UtcNow
            };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", null))
                .ReturnsAsync(currentUser);
            _reactionServiceMock
                .Setup(s => s.UpsertReactionAsync(request, currentUser.Id))
                .ReturnsAsync(createdReaction);

            InitControllerWithUser("user@example.com");

            var result = await _controller.UpsertReaction(request);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            Assert.That(okResult!.Value, Is.SameAs(createdReaction));
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", null), Times.Once);
            _reactionServiceMock.Verify(s => s.UpsertReactionAsync(request, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task UpsertReaction_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            var request = new CreateReactionRequest
            {
                Emote = "thumbs-up",
                StackItemType = "Promise",
                StackItemId = 42
            };

            InitControllerWithUser(null);

            var result = await _controller.UpsertReaction(request);

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
            _reactionServiceMock.Verify(s => s.UpsertReactionAsync(It.IsAny<CreateReactionRequest>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task DeleteReaction_WithAuthenticatedUser_ReturnsNoContent()
        {
            var currentUser = new User { Id = 5, Email = "user@example.com", Name = "User" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", null))
                .ReturnsAsync(currentUser);
            _reactionServiceMock
                .Setup(s => s.RemoveReactionAsync(15, currentUser.Id))
                .Returns(Task.CompletedTask);

            InitControllerWithUser("user@example.com");

            var result = await _controller.DeleteReaction(15);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", null), Times.Once);
            _reactionServiceMock.Verify(s => s.RemoveReactionAsync(15, currentUser.Id), Times.Once);
        }

        [Test]
        public async Task DeleteReaction_WhenNoEmailClaim_ReturnsUnauthorized()
        {
            InitControllerWithUser(null);

            var result = await _controller.DeleteReaction(15);

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
            _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
            _reactionServiceMock.Verify(s => s.RemoveReactionAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task DeleteReaction_WhenServiceThrows_ReturnsBadRequest()
        {
            var currentUser = new User { Id = 5, Email = "user@example.com", Name = "User" };

            _userRepositoryMock
                .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", null))
                .ReturnsAsync(currentUser);
            _reactionServiceMock
                .Setup(s => s.RemoveReactionAsync(15, currentUser.Id))
                .ThrowsAsync(new System.Exception("remove failed"));

            InitControllerWithUser("user@example.com");

            var result = await _controller.DeleteReaction(15);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Is.EqualTo("Cannot remove reaction."));
            _reactionServiceMock.Verify(s => s.RemoveReactionAsync(15, currentUser.Id), Times.Once);
        }
    }
}