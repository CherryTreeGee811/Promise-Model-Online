using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

/// <summary>Unit tests for <see cref="ReactionsController"/> covering reaction CRUD.</summary>
// Requirements: REQ_SYS_004
public class ReactionsControllerUnitTests
{
    private Mock<IReactionService> _reactionServiceMock = null!;
    private Mock<IUserRepository> _userRepositoryMock = null!;
    private Mock<ICommentRepository> _commentRepositoryMock = null!;
    private Mock<IPermissionService> _permissionServiceMock = null!;
    private Mock<IReactionRepository> _reactionRepositoryMock = null!;
    private Mock<ILogger<ReactionsController>> _loggerMock = null!;
    private ReactionsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _reactionServiceMock = new Mock<IReactionService>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _commentRepositoryMock = new Mock<ICommentRepository>();
        _permissionServiceMock = new Mock<IPermissionService>();
        _reactionRepositoryMock = new Mock<IReactionRepository>();
        _loggerMock = new Mock<ILogger<ReactionsController>>();
        _controller = new ReactionsController(
            _reactionServiceMock.Object,
            _userRepositoryMock.Object,
            _commentRepositoryMock.Object,
            _permissionServiceMock.Object,
            _reactionRepositoryMock.Object,
            _loggerMock.Object);
    }

    [Test]
    public async Task REQ_SYS_004_GetReactions_WithValidQuery_ReturnsOkWithReactions()
    {
        // Arrange
        var reactions = new List<ReactionDto>
            {
                new ReactionDto
                {
                    Id = 1,
                    UserId = 10,
                    UserName = "User One",
                    Emote = "thumbs-up",
                    StackItemType = "Promise",
                    StackItemId = 42,
                    CreatedAt = System.DateTime.UtcNow
                },
                new ReactionDto
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

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.GetReactions("Promise", 42);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var okResult = result.Result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);
        Assert.That(okResult!.Value, Is.SameAs(reactions));
        _reactionServiceMock.Verify(s => s.GetReactionsAsync("Promise", 42), Times.Once);
    }

    [Test]
    public async Task REQ_SYS_004_CreateReaction_WithAuthenticatedUser_ReturnsCreatedWithReaction()
    {
        // Arrange
        var request = new CreateReactionRequest
        {
            Emote = "thumbs-up",
            StackItemType = "Promise",
            StackItemId = 42
        };

        var currentUser = new User { Id = 5, Email = "user@example.com", Name = "User" };
        var createdReaction = new ReactionDto
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
            .Setup(s => s.CreateReactionAsync(request, currentUser.Id))
            .ReturnsAsync(createdReaction);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.CreateReaction(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = result.Result as CreatedAtActionResult;
        Assert.That(created, Is.Not.Null);
        Assert.That(created!.Value, Is.SameAs(createdReaction));
        _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", null), Times.Once);
        _reactionServiceMock.Verify(s => s.CreateReactionAsync(request, currentUser.Id), Times.Once);
    }

    [Test]
    public async Task REQ_SYS_004_CreateReaction_WhenNoEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CreateReactionRequest
        {
            Emote = "thumbs-up",
            StackItemType = "Promise",
            StackItemId = 42
        };

        ControllerTestHelpers.SetControllerUser(_controller, null);

        // Act
        var result = await _controller.CreateReaction(request);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        _reactionServiceMock.Verify(s => s.CreateReactionAsync(It.IsAny<CreateReactionRequest>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task REQ_SYS_004_DeleteReaction_WithAuthenticatedUser_ReturnsNoContent()
    {
        // Arrange
        var currentUser = new User { Id = 5, Email = "user@example.com", Name = "User" };

        _userRepositoryMock
            .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", null))
            .ReturnsAsync(currentUser);
        _reactionServiceMock
            .Setup(s => s.RemoveReactionAsync(15, currentUser.Id))
            .Returns(Task.CompletedTask);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.DeleteReaction(15);

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", null), Times.Once);
        _reactionServiceMock.Verify(s => s.RemoveReactionAsync(15, currentUser.Id), Times.Once);
    }

    [Test]
    public async Task REQ_SYS_004_DeleteReaction_WhenNoEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, null);

        // Act
        var result = await _controller.DeleteReaction(15);

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
        _userRepositoryMock.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        _reactionServiceMock.Verify(s => s.RemoveReactionAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    [Description("REQ-SEC-LOG-001")]
    public async Task REQ_SYS_004_DeleteReaction_WhenServiceThrows_ReturnsBadRequest()
    {
        // Arrange
        var currentUser = new User { Id = 5, Email = "user@example.com", Name = "User" };

        _userRepositoryMock
            .Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", null))
            .ReturnsAsync(currentUser);
        _reactionServiceMock
            .Setup(s => s.RemoveReactionAsync(15, currentUser.Id))
            .ThrowsAsync(new System.Exception("remove failed"));

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.DeleteReaction(15);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("Cannot remove reaction."));
        _reactionServiceMock.Verify(s => s.RemoveReactionAsync(15, currentUser.Id), Times.Once);
        _loggerMock.VerifyLog(LogLevel.Warning, "Failed to delete reaction");
    }
}
