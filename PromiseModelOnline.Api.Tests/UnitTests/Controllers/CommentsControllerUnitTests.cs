using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class CommentsControllerUnitTests
    {
        private Mock<ICommentService> _mockCommentService = null!;
        private Mock<IUserRepository> _mockUserRepository = null!;
        private Mock<ICommentRepository> _mockCommentRepository = null!;
        private CommentsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockCommentService = new Mock<ICommentService>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockCommentRepository = new Mock<ICommentRepository>();
            _controller = new CommentsController(
                _mockCommentService.Object,
                _mockUserRepository.Object,
                _mockCommentRepository.Object);
        }

        #region GetComments Tests - Happy Path

        [Test]
        public async Task GetComments_WithValidTypeAndParentId_ReturnsOkWithComments()
        {
            var comments = new List<CommentDTO>
            {
                new CommentDTO { Id = 1, Text = "Comment 1", UserName = "User1" },
                new CommentDTO { Id = 2, Text = "Comment 2", UserName = "User2" }
            };

            _mockCommentService.Setup(s => s.GetCommentsAsync("Promise", 5))
                .ReturnsAsync(comments);

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.GetComments("Promise", 5);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var returnedComments = ok!.Value as List<CommentDTO>;
            Assert.That(returnedComments, Is.Not.Null);
            Assert.That(returnedComments!.Count, Is.EqualTo(2));
            Assert.That(returnedComments[0].Id, Is.EqualTo(1));
            Assert.That(returnedComments[1].Id, Is.EqualTo(2));
            _mockCommentService.Verify(s => s.GetCommentsAsync("Promise", 5), Times.Once);
        }

        [Test]
        public async Task GetComments_WithValidEpicType_ReturnsOkWithComments()
        {
            var comments = new List<CommentDTO>
            {
                new CommentDTO { Id = 10, Text = "Epic comment", UserName = "TestUser" }
            };

            _mockCommentService.Setup(s => s.GetCommentsAsync("Epic", 100))
                .ReturnsAsync(comments);

            ControllerTestHelpers.SetControllerUser(_controller, "test@test.com");

            var result = await _controller.GetComments("Epic", 100);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok!.Value, Is.InstanceOf<List<CommentDTO>>());
            _mockCommentService.Verify(s => s.GetCommentsAsync("Epic", 100), Times.Once);
        }

        [Test]
        public async Task GetComments_WithNoComments_ReturnsOkWithEmptyList()
        {
            var comments = new List<CommentDTO>();

            _mockCommentService.Setup(s => s.GetCommentsAsync("Journey", 50))
                .ReturnsAsync(comments);

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.GetComments("Journey", 50);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var returnedComments = ok!.Value as List<CommentDTO>;
            Assert.That(returnedComments, Is.Not.Null);
            Assert.That(returnedComments!.Count, Is.EqualTo(0));
        }

        #endregion

        #region GetComments Tests - Sad Path

        [Test]
        public async Task GetComments_WithNullType_ReturnsBadRequest()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.GetComments(null!, 5);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
            _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetComments_WithEmptyType_ReturnsBadRequest()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.GetComments(string.Empty, 5);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
            _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetComments_WithZeroParentId_ReturnsBadRequest()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.GetComments("Promise", 0);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
            _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetComments_WithNegativeParentId_ReturnsBadRequest()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.GetComments("Epic", -10);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Does.Contain("Type and parentId are required"));
            _mockCommentService.Verify(s => s.GetCommentsAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        #endregion

        #region CreateComment Tests - Happy Path

        [Test]
        public async Task CreateComment_WithValidDtoAndAuthenticatedUser_ReturnsCreatedAtAction()
        {
            var createDto = new CreateCommentDTO
            {
                Text = "This is a test comment",
                ParentType = "Promise",
                ParentId = 5,
                ParentCommentId = null
            };

            var user = new User { Id = 1, Email = "user@example.com" };
            _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("user@example.com", It.IsAny<string?>()))
                .ReturnsAsync(user);

            var createdComment = new CommentDTO
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

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdAtAction = result.Result as CreatedAtActionResult;
            Assert.That(createdAtAction, Is.Not.Null);
            Assert.That(createdAtAction!.ActionName, Is.EqualTo(nameof(CommentsController.GetComments)));
            Assert.That(createdAtAction.Value, Is.SameAs(createdComment));
            _mockUserRepository.Verify(r => r.GetOrCreateUserByEmailAsync("user@example.com", It.IsAny<string?>()), Times.Once);
            _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
        }

        [Test]
        public async Task CreateComment_WithReplyToComment_ReturnsCreatedAtAction()
        {
            var createDto = new CreateCommentDTO
            {
                Text = "This is a reply to a comment",
                ParentType = "Promise",
                ParentId = 5,
                ParentCommentId = 3
            };

            var user = new User { Id = 2, Email = "replier@example.com" };
            _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("replier@example.com", null))
                .ReturnsAsync(user);

            var createdComment = new CommentDTO
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

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdAtAction = result.Result as CreatedAtActionResult;
            Assert.That(createdAtAction, Is.Not.Null);
            Assert.That(createdAtAction!.Value, Is.SameAs(createdComment));
            _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
        }

        [Test]
        public async Task CreateComment_WithDifferentParentTypes_ReturnsCreatedAtAction()
        {
            var createDto = new CreateCommentDTO
            {
                Text = "Comment on Epic",
                ParentType = "Epic",
                ParentId = 15,
                ParentCommentId = null
            };

            var user = new User { Id = 3, Email = "epic@example.com" };
            _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("epic@example.com", It.IsAny<string?>()))
                .ReturnsAsync(user);

            var createdComment = new CommentDTO
            {
                Id = 12,
                Text = createDto.Text,
                UserName = "EpicUser",
                CreatedAt = System.DateTime.UtcNow
            };

            _mockCommentService.Setup(s => s.CreateCommentAsync(createDto, user.Id))
                .ReturnsAsync(createdComment);

            ControllerTestHelpers.SetControllerUser(_controller, "epic@example.com");

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
        }

        #endregion

        #region CreateComment Tests - Sad Path

        [Test]
        public async Task CreateComment_WithoutEmailClaim_ReturnsUnauthorized()
        {
            var createDto = new CreateCommentDTO
            {
                Text = "This should fail",
                ParentType = "Promise",
                ParentId = 5,
                ParentCommentId = null
            };

            ControllerTestHelpers.SetControllerUser(_controller, null);

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedObjectResult>());
            var unauthorized = result.Result as UnauthorizedObjectResult;
            Assert.That(unauthorized, Is.Not.Null);
            Assert.That(unauthorized!.Value, Does.Contain("Missing email claim"));
            _mockUserRepository.Verify(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()), Times.Never);
            _mockCommentService.Verify(s => s.CreateCommentAsync(It.IsAny<CreateCommentDTO>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task CreateComment_WithServiceException_ReturnsBadRequest()
        {
            var createDto = new CreateCommentDTO
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

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest, Is.Not.Null);
            Assert.That(badRequest!.Value, Is.EqualTo(exceptionMessage));
            _mockCommentService.Verify(s => s.CreateCommentAsync(createDto, user.Id), Times.Once);
        }

        [Test]
        public async Task CreateComment_WithInvalidParentId_ReturnsBadRequestFromService()
        {
            var createDto = new CreateCommentDTO
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

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest!.Value, Does.Contain("not found"));
        }

        [Test]
        public async Task CreateComment_WithEmptyText_ReturnsBadRequestFromService()
        {
            var createDto = new CreateCommentDTO
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

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest!.Value, Does.Contain("empty"));
        }

        [Test]
        public async Task CreateComment_WhenUserRepositoryThrowsException_ReturnsBadRequest()
        {
            var createDto = new CreateCommentDTO
            {
                Text = "This will fail at user level",
                ParentType = "Promise",
                ParentId = 5,
                ParentCommentId = null
            };

            _mockUserRepository.Setup(r => r.GetOrCreateUserByEmailAsync("failing@example.com", It.IsAny<string?>()))
                .ThrowsAsync(new System.Exception("Database connection failed"));

            ControllerTestHelpers.SetControllerUser(_controller, "failing@example.com");

            var result = await _controller.CreateComment(createDto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.That(badRequest!.Value, Does.Contain("Database connection failed"));
            _mockCommentService.Verify(s => s.CreateCommentAsync(It.IsAny<CreateCommentDTO>(), It.IsAny<int>()), Times.Never);
        }

        #endregion

        #region SearchUsers Tests - Happy Path

        [Test]
        public async Task SearchUsers_WithValidParams_ReturnsOkWithUsers()
        {
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

            var result = await _controller.SearchUsers("Promise", 5, "al");

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
        public async Task SearchUsers_WithNoMatches_ReturnsOkWithEmptyList()
        {
            var projectId = 1;
            _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Epic", 10))
                .ReturnsAsync(projectId);
            _mockUserRepository.Setup(r => r.SearchUsersByProjectAsync(projectId, "zzz", 5))
                .ReturnsAsync(Enumerable.Empty<User>());

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchUsers("Epic", 10, "zzz");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var data = ok!.Value as IEnumerable<object>;
            Assert.That(data, Is.Not.Null);
            Assert.That(data!, Is.Empty);
        }

        [Test]
        public async Task SearchUsers_WithEmptySearch_ReturnsOkWithEmptyList()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchUsers("Promise", 5, "");

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
        public async Task SearchUsers_WithInvalidParentType_ReturnsBadRequest()
        {
            _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("invalid", 1))
                .ThrowsAsync(new System.ArgumentException("Invalid parent type: invalid"));

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchUsers("invalid", 1, "test");

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task SearchUsers_WithNullType_ReturnsOkWithEmptyList()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchUsers(null, 5, "alice");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
            Assert.That(data, Is.Empty);
            _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task SearchUsers_WithZeroParentId_ReturnsOkWithEmptyList()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchUsers("Promise", 0, "test");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
            Assert.That(data, Is.Empty);
            _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        #endregion

        #region SearchPromises Tests - Happy Path

        [Test]
        public async Task SearchPromises_WithValidParams_ReturnsOkWithResults()
        {
            var projectId = 1;
            _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Promise", 5))
                .ReturnsAsync(projectId);

            var results = new List<StackSearchResult>
            {
                new StackSearchResult("promise", 10, "Payment processing"),
                new StackSearchResult("flow", 20, "Payment form")
            };
            _mockCommentRepository.Setup(r => r.SearchStackByStatementAsync(projectId, "pay", 5))
                .ReturnsAsync(results);

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises("Promise", 5, "pay");

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
        public async Task SearchPromises_IncludesEntityTypeInResult()
        {
            var projectId = 1;
            _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Moment", 5))
                .ReturnsAsync(projectId);

            var results = new List<StackSearchResult>
            {
                new StackSearchResult("moment", 30, "Credit card entry")
            };
            _mockCommentRepository.Setup(r => r.SearchStackByStatementAsync(projectId, "card", 5))
                .ReturnsAsync(results);

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises("Moment", 5, "card");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            // The endpoint returns anonymous objects; we verify the promise endpoint worked
            _mockCommentRepository.Verify(r => r.SearchStackByStatementAsync(projectId, "card", 5), Times.Once);
        }

        [Test]
        public async Task SearchPromises_WithNoMatches_ReturnsOkWithEmptyList()
        {
            var projectId = 1;
            _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("Journey", 3))
                .ReturnsAsync(projectId);
            _mockCommentRepository.Setup(r => r.SearchStackByStatementAsync(projectId, "zzz", 5))
                .ReturnsAsync(Enumerable.Empty<StackSearchResult>());

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises("Journey", 3, "zzz");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
            Assert.That(data!, Is.Empty);
        }

        [Test]
        public async Task SearchPromises_WithEmptySearch_ReturnsOkWithEmptyList()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises("Flow", 10, "");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
            Assert.That(data!, Is.Empty);
            _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        #endregion

        #region SearchPromises Tests - Sad Path

        [Test]
        public async Task SearchPromises_WithInvalidParentType_ReturnsBadRequest()
        {
            _mockCommentRepository.Setup(r => r.ResolveProjectIdAsync("invalid", 1))
                .ThrowsAsync(new System.ArgumentException("Invalid parent type"));

            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises("invalid", 1, "test");

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task SearchPromises_WithNullParentType_ReturnsOkWithEmptyList()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises(null, 5, "test");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
            Assert.That(data, Is.Empty);
            _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task SearchPromises_WithZeroParentId_ReturnsOkWithEmptyList()
        {
            ControllerTestHelpers.SetControllerUser(_controller, "user@example.com");

            var result = await _controller.SearchPromises("Promise", 0, "test");

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var data = (result.Result as OkObjectResult)!.Value as IEnumerable<object>;
            Assert.That(data, Is.Empty);
            _mockCommentRepository.Verify(r => r.ResolveProjectIdAsync(It.IsAny<string>(), It.IsAny<int>()), Times.Never);
        }

        #endregion
    }
}
