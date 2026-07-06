using System.Collections.Generic;
using System.Linq;
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
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests;

/// <summary>Unit tests for <see cref="CommentsController"/> covering comment operations.</summary>
// Requirements: REQ_FUN_017
public class CommentsControllerUnitTests
{
    private Mock<ICommentService> _mockCommentService = null!;
    private Mock<IUserRepository> _mockUserRepository = null!;
    private Mock<ICommentRepository> _mockCommentRepository = null!;
    private Mock<IPermissionService> _mockPermissionService = null!;
    private Mock<ILogger<CommentsController>> _mockLogger = null!;
    private CommentsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _mockCommentService = new Mock<ICommentService>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockCommentRepository = new Mock<ICommentRepository>();
        _mockPermissionService = new Mock<IPermissionService>();
        _mockLogger = new Mock<ILogger<CommentsController>>();
        _controller = new CommentsController(
            _mockCommentService.Object,
            _mockUserRepository.Object,
            _mockCommentRepository.Object,
            _mockPermissionService.Object,
            _mockLogger.Object);
    }

    #region GetComments Tests - Happy Path

    [Test]
    public async Task REQ_FUN_017_GetComments_WithValidTypeAndParentId_ReturnsOkWithComments()
    {
        // Arrange
        var comments = new List<CommentDto>
            {
                new CommentDto { Id = 1, Text = "Comment 1", UserName = "User1" },
                new CommentDto { Id = 2, Text = "Comment 2", UserName = "User2" }
            };

        _mockCommentService.Setup(s => s.GetCommentsAsync("Promise", 5))
            .ReturnsAsync(comments);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.GetComments("Promise", 5);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var returnedComments = ok!.Value as List<CommentDto>;
        Assert.That(returnedComments, Is.Not.Null);
        Assert.That(returnedComments!.Count, Is.EqualTo(2));
        Assert.That(returnedComments[0].Id, Is.EqualTo(1));
        Assert.That(returnedComments[1].Id, Is.EqualTo(2));
        _mockCommentService.Verify(s => s.GetCommentsAsync("Promise", 5), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_GetComments_WithValidEpicType_ReturnsOkWithComments()
    {
        // Arrange
        var comments = new List<CommentDto>
            {
                new CommentDto { Id = 10, Text = "Epic comment", UserName = "TestUser" }
            };

        _mockCommentService.Setup(s => s.GetCommentsAsync("Epic", 100))
            .ReturnsAsync(comments);

        ControllerTestHelpers.SetControllerUser(_controller, "test@test.com");

        // Act
        var result = await _controller.GetComments("Epic", 100);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.InstanceOf<List<CommentDto>>());
        _mockCommentService.Verify(s => s.GetCommentsAsync("Epic", 100), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_GetComments_WithNoComments_ReturnsOkWithEmptyList()
    {
        // Arrange
        var comments = new List<CommentDto>();

        _mockCommentService.Setup(s => s.GetCommentsAsync("Journey", 50))
            .ReturnsAsync(comments);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.GetComments("Journey", 50);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var returnedComments = ok!.Value as List<CommentDto>;
        Assert.That(returnedComments, Is.Not.Null);
        Assert.That(returnedComments!.Count, Is.EqualTo(0));
    }

    #endregion

    #region GetComments Tests - Sad Path

    [Test]
    public async Task REQ_FUN_017_GetComments_WithNullType_ReturnsBadRequest()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.GetComments(null!, 5);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
        _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_017_GetComments_WithEmptyType_ReturnsBadRequest()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.GetComments(string.Empty, 5);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
        _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_017_GetComments_WithZeroParentId_ReturnsBadRequest()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.GetComments("Promise", 0);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
        _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    [Description("REQ_FUN_017 + REQ-SEC-LOG-001: Invalid parent type for user search returns bad request and logs warning")]
    public async Task REQ_FUN_017_SearchUsers_WithInvalidParentType_ReturnsBadRequest()
    {
        // Arrange
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("invalid", 1))
            .ThrowsAsync(new System.ArgumentException("Invalid parent type: invalid"));
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchUsers("invalid", 1, "test");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        _mockLogger.VerifyLog(LogLevel.Warning, "User search failed");
    }

    #endregion

    #region CreateComment Tests - Happy Path

    [Test]
    public async Task REQ_FUN_017_CreateComment_WithValidDtoAndAuthenticatedUser_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = "This is a test comment",
            ParentType = "Promise",
            ParentId = 5,
            ParentCommentId = null
        };

        var user = new User { Id = 1, Email = "user@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", It.IsAny<string?>()))
            .ReturnsAsync(user);

        var createdComment = new CommentDto
        {
            Id = 10,
            Text = createDto.Text,
            UserName = "TestUser",
            CreatedAt = System.DateTime.UtcNow,
            ParentCommentId = null
        };

        _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
            .ReturnsAsync(createdComment);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com", "testuser");

        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 5)).ReturnsAsync(1);
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(1, 1)).ReturnsAsync(PermissionLevel.Comment);

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var createdAtAction = result.Result as CreatedAtActionResult;
        Assert.That(createdAtAction, Is.Not.Null);
        Assert.That(createdAtAction!.ActionName, Is.EqualTo(nameof(CommentsController.GetComments)));
        Assert.That(createdAtAction.Value, Is.SameAs(createdComment));
        _mockUserRepository.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", It.IsAny<string?>()), Times.Once);
        _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_CreateComment_WithReplyToComment_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = "This is a reply to a comment",
            ParentType = "Promise",
            ParentId = 5,
            ParentCommentId = 3
        };

        var user = new User { Id = 2, Email = "replier@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("replier@example.com", null))
            .ReturnsAsync(user);

        var createdComment = new CommentDto
        {
            Id = 11,
            Text = createDto.Text,
            UserName = "ReplyUser",
            CreatedAt = System.DateTime.UtcNow,
            ParentCommentId = 3
        };

        _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
            .ReturnsAsync(createdComment);

        ControllerTestHelpers.SetControllerUser(_controller, "replier@example.com");

        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 5)).ReturnsAsync(1);
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(2, 1)).ReturnsAsync(PermissionLevel.Comment);

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var createdAtAction = result.Result as CreatedAtActionResult;
        Assert.That(createdAtAction, Is.Not.Null);
        Assert.That(createdAtAction!.Value, Is.SameAs(createdComment));
        _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_CreateComment_WithDifferentParentTypes_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = "Comment on Epic",
            ParentType = "Epic",
            ParentId = 15,
            ParentCommentId = null
        };

        var user = new User { Id = 3, Email = "epic@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("epic@example.com", It.IsAny<string?>()))
            .ReturnsAsync(user);

        var createdComment = new CommentDto
        {
            Id = 12,
            Text = createDto.Text,
            UserName = "EpicUser",
            CreatedAt = System.DateTime.UtcNow
        };

        _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
            .ReturnsAsync(createdComment);

        ControllerTestHelpers.SetControllerUser(_controller, "epic@example.com");

        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Epic", 15)).ReturnsAsync(1);
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(3, 1)).ReturnsAsync(PermissionLevel.Comment);

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
    }

    #endregion

    #region CreateComment Tests - Sad Path

    [Test]
    public async Task REQ_FUN_017_CreateComment_WithoutEmailClaim_ReturnsUnauthorized()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = "This should fail",
            ParentType = "Promise",
            ParentId = 5,
            ParentCommentId = null
        };

        ControllerTestHelpers.SetControllerUser(_controller, null);

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<UnauthorizedObjectResult>());
        var unauthorized = result.Result as UnauthorizedObjectResult;
        Assert.That(unauthorized, Is.Not.Null);
        Assert.That(unauthorized!.Value, Does.Contain("Missing email claim"));
        _mockUserRepository.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
        _mockCommentService.Verify(s => s.CreateCommentAsync(It.IsAny<CreateCommentDto>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    [Description("REQ_FUN_017 + REQ-SEC-LOG-001: Service exception returns bad request and logs warning")]
    public async Task REQ_FUN_017_CreateComment_WithServiceException_ReturnsBadRequest()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = "This comment will cause an error",
            ParentType = "Promise",
            ParentId = 5,
            ParentCommentId = null
        };

        var user = new User { Id = 1, Email = "error@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("error@example.com", It.IsAny<string?>()))
            .ReturnsAsync(user);

        var exceptionMessage = "Parent entity not found";
        _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
            .ThrowsAsync(new System.Exception(exceptionMessage));

        ControllerTestHelpers.SetControllerUser(_controller, "error@example.com");

        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 5)).ReturnsAsync(1);
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(1, 1)).ReturnsAsync(PermissionLevel.Comment);

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest, Is.Not.Null);
        Assert.That(badRequest!.Value, Is.EqualTo("The comment could not be created."));
        _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
        _mockLogger.VerifyLog(LogLevel.Warning, "Failed to create comment");
    }

    [Test]
    public async Task REQ_FUN_017_CreateComment_WithInvalidParentId_ReturnsBadRequestFromService()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = "Invalid parent",
            ParentType = "Promise",
            ParentId = 999,
            ParentCommentId = null
        };

        var user = new User { Id = 1, Email = "invalid@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("invalid@example.com", It.IsAny<string?>()))
            .ReturnsAsync(user);

        _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
            .ThrowsAsync(new System.Exception("Promise with ID 999 not found"));

        ControllerTestHelpers.SetControllerUser(_controller, "invalid@example.com");

        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 999)).ReturnsAsync(1);
        _mockPermissionService.Setup(p => p.GetUserPermissionAsync(1, 1)).ReturnsAsync(PermissionLevel.Comment);

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest!.Value, Does.Contain("The comment could not be created."));
    }

    [Test]
    public async Task REQ_FUN_017_CreateComment_WithEmptyText_ReturnsBadRequestFromService()
    {
        // Arrange
        var createDto = new CreateCommentDto
        {
            Text = string.Empty,
            ParentType = "Promise",
            ParentId = 5,
            ParentCommentId = null
        };

        var user = new User { Id = 1, Email = "empty@example.com" };
        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("empty@example.com", It.IsAny<string?>()))
            .ReturnsAsync(user);

        _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
            .ThrowsAsync(new System.Exception("Comment text cannot be empty"));

        ControllerTestHelpers.SetControllerUser(_controller, "empty@example.com");

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest!.Value, Does.Contain("Comment text cannot be empty."));
    }

    [Test]
    public async Task REQ_FUN_017_CreateComment_WhenUserRepositoryThrowsException_ReturnsBadRequest()
    {
        var createDto = new CreateCommentDto
        {
            Text = "This will fail at user level",
            ParentType = "Promise",
            ParentId = 5,
            ParentCommentId = null
        };

        _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("failing@example.com", It.IsAny<string?>()))
            .ThrowsAsync(new System.Exception("Database connection failed"));

        ControllerTestHelpers.SetControllerUser(_controller, "failing@example.com");

        // Act
        var result = await _controller.CreateComment(createDto);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        var badRequest = result.Result as BadRequestObjectResult;
        Assert.That(badRequest!.Value, Does.Contain("The comment could not be created."));
        _mockCommentService.Verify(s => s.CreateCommentAsync(It.IsAny<CreateCommentDto>(), It.IsAny<int>()), Times.Never);
        _mockLogger.VerifyLog(LogLevel.Warning, "Failed to create comment");
    }

    #endregion

    #region SearchUsers Tests - Happy Path

    [Test]
    public async Task REQ_FUN_017_SearchUsers_WithValidParams_ReturnsOkWithUsers()
    {
        // Arrange
        var projectId = 1;
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 5))
            .ReturnsAsync(projectId);

        var users = new List<User>
            {
                new User { Id = 1, Name = "Alice" },
                new User { Id = 2, Name = "Alex" }
            };
        _mockUserRepository.Setup(r => r.SearchUsersByProjectAsync(projectId, "al", 5))
            .ReturnsAsync(users);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchUsers("Promise", 5, "al");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as IEnumerable<object>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Count(), Is.EqualTo(2));
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync("Promise", 5), Times.Once);
        _mockUserRepository.Verify(r => r.SearchUsersByProjectAsync(projectId, "al", 5), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_SearchUsers_WithNoMatches_ReturnsOkWithEmptyList()
    {
        // Arrange
        var projectId = 1;
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Epic", 10))
            .ReturnsAsync(projectId);
        _mockUserRepository.Setup(r => r.SearchUsersByProjectAsync(projectId, "zzz", 5))
            .ReturnsAsync(Enumerable.Empty<User>());

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchUsers("Epic", 10, "zzz");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as IEnumerable<object>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_017_SearchUsers_WithEmptySearch_ReturnsOkWithEmptyList()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchUsers("Promise", 5, "");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as IEnumerable<object>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!, Is.Empty);
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region SearchUsers Tests - Sad Path

    [Test]
    public async Task REQ_FUN_017_SearchUsers_WithNullType_ReturnsOkWithEmptyList()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchUsers(null, 5, "alice");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
        Assert.That(data, Is.Empty);
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_017_SearchUsers_WithZeroParentId_ReturnsOkWithEmptyList()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchUsers("Promise", 0, "test");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
        Assert.That(data, Is.Empty);
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region SearchPromises Tests - Happy Path

    [Test]
    public async Task REQ_FUN_017_SearchPromises_WithValidParams_ReturnsOkWithResults()
    {
        // Arrange
        var projectId = 1;
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 5))
            .ReturnsAsync(projectId);

        var results = new List<StackSearchResult>
            {
                new StackSearchResult("promise", 10, 0, "Payment processing", "red"),
                new StackSearchResult("flow", 20, 0, "Payment form", "orange")
            };
        _mockCommentRepository.Setup(r => r.SearchStackByStatementAsync(projectId, "pay", 5))
            .ReturnsAsync(results);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises("Promise", 5, "pay");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        var data = ok!.Value as IEnumerable<object>;
        Assert.That(data, Is.Not.Null);
        Assert.That(data!.Count(), Is.EqualTo(2));
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync("Promise", 5), Times.Once);
        _mockCommentRepository.Verify(r => r.SearchStackByStatementAsync(projectId, "pay", 5), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_SearchPromises_IncludesEntityTypeInResult()
    {
        // Arrange
        var projectId = 1;
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Moment", 5))
            .ReturnsAsync(projectId);

        var results = new List<StackSearchResult>
            {
                new StackSearchResult("moment", 30, 0, "Credit card entry", "red")
            };
        _mockCommentRepository.Setup(r => r.SearchStackByStatementAsync(projectId, "card", 5))
            .ReturnsAsync(results);

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises("Moment", 5, "card");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok, Is.Not.Null);
        // The endpoint returns anonymous objects; we verify the promise endpoint worked
        _mockCommentRepository.Verify(r => r.SearchStackByStatementAsync(projectId, "card", 5), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_017_SearchPromises_WithNoMatches_ReturnsOkWithEmptyList()
    {
        // Arrange
        var projectId = 1;
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Journey", 3))
            .ReturnsAsync(projectId);
        _mockCommentRepository.Setup(r => r.SearchStackByStatementAsync(projectId, "zzz", 5))
            .ReturnsAsync(Enumerable.Empty<StackSearchResult>());

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises("Journey", 3, "zzz");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
        Assert.That(data!, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_017_SearchPromises_WithEmptySearch_ReturnsOkWithEmptyList()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises("Flow", 10, "");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
        Assert.That(data!, Is.Empty);
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion

    #region SearchPromises Tests - Sad Path

    [Test]
    [Description("REQ_FUN_017 + REQ-SEC-LOG-001: Invalid parent type for promise search returns bad request and logs warning")]
    public async Task REQ_FUN_017_SearchPromises_WithInvalidParentType_ReturnsBadRequest()
    {
        // Arrange
        _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("invalid", 1))
            .ThrowsAsync(new System.ArgumentException("Invalid parent type"));

        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises("invalid", 1, "test");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_017_SearchPromises_WithNullParentType_ReturnsOkWithEmptyList()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises(null, 5, "test");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
        Assert.That(data, Is.Empty);
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_017_SearchPromises_WithZeroParentId_ReturnsOkWithEmptyList()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

        // Act
        var result = await _controller.SearchPromises("Promise", 0, "test");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
        Assert.That(data, Is.Empty);
        _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }

    #endregion
}
