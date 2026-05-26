using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Helpers;

namespace PromiseModelOnline.Api.Tests.UnitTests.Controllers
{
    public class CommentsControllerUnitTests
    {
        private Mock<ICommentService> _mockCommentService = null!;
        private Mock<IUserRepository> _mockUserRepository = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;

        private CommentsController _controller = null!;

        private readonly User _testUser = new User { Id = 1, Email = "user@test.com" };

        [SetUp]
        public void SetUp()
        {
            _mockCommentService = new Mock<ICommentService>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();

            _controller = new CommentsController(
                _mockCommentService.Object,
                _mockUserRepository.Object,
                _mockPermissionService.Object
            );
        }

        // ======================================
        // ✅ GET COMMENTS
        // ======================================

        [Test]
        public async Task GetComments_WithValidInput_ReturnsOk()
        {
            var comments = new List<CommentDTO>
            {
                new CommentDTO { Id = 1, Text = "Comment 1" },
                new CommentDTO { Id = 2, Text = "Comment 2" }
            };

            _mockCommentService
                .Setup(s => s.GetCommentsAsync("Promise", 5))
                .ReturnsAsync(comments);

            ControllerTestHelper.SetupAuthenticatedUser(
                _controller,
                _mockUserRepository,
                _mockPermissionService
            );

            var result = await _controller.GetComments("Promise", 5);

            var ok = result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);

            var returned = ok!.Value as List<CommentDTO>;
            Assert.That(returned!.Count, Is.EqualTo(2));
        }

        [Test]
        public async Task GetComments_InvalidInput_ReturnsBadRequest()
        {
            var result = await _controller.GetComments("", 5);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        // ======================================
        // ✅ CREATE COMMENT
        // ======================================

        [Test]
        public async Task CreateComment_Valid_ReturnsCreated()
        {
            var dto = new CreateCommentDTO
            {
                Text = "Test",
                ParentType = "Promise",
                ParentId = 1
            };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()))
                .ReturnsAsync(_testUser);

            _mockCommentService
                .Setup(s => s.CreateCommentAsync(dto, _testUser.Id))
                .ReturnsAsync(new CommentDTO());

            ControllerTestHelper.SetupAuthenticatedUser(
                _controller,
                _mockUserRepository,
                _mockPermissionService
            );

            var result = await _controller.CreateComment(dto);

            Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreateComment_NoUser_ReturnsUnauthorized()
        {
            var dto = new CreateCommentDTO
            {
                Text = "Test",
                ParentType = "Promise",
                ParentId = 1
            };

            // ✅ must provide HttpContext but no email claim
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.CreateComment(dto);

            Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task CreateComment_ServiceThrows_ReturnsBadRequest()
        {
            var dto = new CreateCommentDTO
            {
                Text = "Test",
                ParentType = "Promise",
                ParentId = 1
            };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()))
                .ReturnsAsync(_testUser);

            _mockCommentService
                .Setup(s => s.CreateCommentAsync(dto, _testUser.Id))
                .ThrowsAsync(new System.Exception());

            ControllerTestHelper.SetupAuthenticatedUser(
                _controller,
                _mockUserRepository,
                _mockPermissionService
            );

            var result = await _controller.CreateComment(dto);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
    }
}