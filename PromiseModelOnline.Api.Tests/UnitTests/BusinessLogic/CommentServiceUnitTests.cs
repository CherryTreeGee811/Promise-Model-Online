using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class CommentServiceUnitTests
    {
        private Mock<ICommentRepository> _commentRepoMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IGenericMapper<Comment, CommentDTO>> _mapperMock = null!;

        private Mock<IGenericRepository<Promise>> _promiseRepoMock = null!;
        private Mock<IGenericRepository<Epic>> _epicRepoMock = null!;
        private Mock<IGenericRepository<Journey>> _journeyRepoMock = null!;
        private Mock<IGenericRepository<Flow>> _flowRepoMock = null!;
        private Mock<IGenericRepository<Moment>> _momentRepoMock = null!;

        private CommentService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _commentRepoMock = new Mock<ICommentRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IGenericMapper<Comment, CommentDTO>>();

            _promiseRepoMock = new Mock<IGenericRepository<Promise>>();
            _epicRepoMock = new Mock<IGenericRepository<Epic>>();
            _journeyRepoMock = new Mock<IGenericRepository<Journey>>();
            _flowRepoMock = new Mock<IGenericRepository<Flow>>();
            _momentRepoMock = new Mock<IGenericRepository<Moment>>();

            _service = new CommentService(
                _commentRepoMock.Object,
                _userRepoMock.Object,
                _mapperMock.Object,
                _promiseRepoMock.Object,
                _epicRepoMock.Object,
                _journeyRepoMock.Object,
                _flowRepoMock.Object,
                _momentRepoMock.Object
            );
        }

        // ===============================
        // ✅ GET COMMENTS
        // ===============================

        [Test]
        public async Task GetCommentsAsync_ReturnsMappedDtos()
        {
            var comments = new List<Comment>
            {
                new Comment { Id = 1, Text = "Hello" },
                new Comment { Id = 2, Text = "World" }
            };

            _commentRepoMock
                .Setup(r => r.GetCommentsForEntityAsync("moment", 10))
                .ReturnsAsync(comments);

            _mapperMock
                .Setup(m => m.Map(It.IsAny<Comment>(), It.IsAny<IGenericService<Comment>>()))
                .Returns((Comment c, IGenericService<Comment> _) =>
                    new CommentDTO { Id = c.Id, Text = c.Text });

            var result = await _service.GetCommentsAsync("moment", 10);

            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Text, Is.EqualTo("Hello"));
        }

        [Test]
        public async Task GetCommentsAsync_NoComments_ReturnsEmpty()
        {
            _commentRepoMock
                .Setup(r => r.GetCommentsForEntityAsync("epic", 5))
                .ReturnsAsync(new List<Comment>());

            var result = await _service.GetCommentsAsync("epic", 5);

            Assert.That(result, Is.Empty);
        }

        // ===============================
        // ✅ CREATE COMMENT
        // ===============================

        [Test]
        public async Task CreateCommentAsync_Promise_SetsProductPromiseId()
        {
            var dto = new CreateCommentDTO { Text = "Test", ParentType = "promise", ParentId = 10 };

            Comment? captured = null;

            _commentRepoMock
                .Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                .Callback<Comment>(c => captured = c)
                .Returns(Task.CompletedTask);

            _mapperMock
                .Setup(m => m.Map(It.IsAny<Comment>(), It.IsAny<IGenericService<Comment>>()))
                .Returns(new CommentDTO());

            await _service.CreateCommentAsync(dto, 1);

            Assert.That(captured!.ProductPromiseId, Is.EqualTo(10));
        }

        [Test]
        public async Task CreateCommentAsync_Epic_SetsEpicId()
        {
            var dto = new CreateCommentDTO { Text = "Test", ParentType = "epic", ParentId = 3 };

            Comment? captured = null;

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                .Callback<Comment>(c => captured = c)
                .Returns(Task.CompletedTask);

            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), It.IsAny<IGenericService<Comment>>()))
                .Returns(new CommentDTO());

            await _service.CreateCommentAsync(dto, 1);

            Assert.That(captured!.EpicId, Is.EqualTo(3));
        }

        [Test]
        public async Task CreateCommentAsync_Journey_SetsJourneyId()
        {
            var dto = new CreateCommentDTO { Text = "Test", ParentType = "journey", ParentId = 4 };

            Comment? captured = null;

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                .Callback<Comment>(c => captured = c)
                .Returns(Task.CompletedTask);

            await _service.CreateCommentAsync(dto, 1);

            Assert.That(captured!.JourneyId, Is.EqualTo(4));
        }

        [Test]
        public async Task CreateCommentAsync_Flow_SetsFlowId()
        {
            var dto = new CreateCommentDTO { Text = "Test", ParentType = "flow", ParentId = 5 };

            Comment? captured = null;

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                .Callback<Comment>(c => captured = c)
                .Returns(Task.CompletedTask);

            await _service.CreateCommentAsync(dto, 1);

            Assert.That(captured!.FlowId, Is.EqualTo(5));
        }

        [Test]
        public async Task CreateCommentAsync_Moment_SetsMomentId()
        {
            var dto = new CreateCommentDTO { Text = "Test", ParentType = "moment", ParentId = 6 };

            Comment? captured = null;

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                .Callback<Comment>(c => captured = c)
                .Returns(Task.CompletedTask);

            await _service.CreateCommentAsync(dto, 1);

            Assert.That(captured!.MomentId, Is.EqualTo(6));
        }

        [Test]
        public void CreateCommentAsync_InvalidParent_Throws()
        {
            var dto = new CreateCommentDTO
            {
                Text = "Bad",
                ParentType = "invalid",
                ParentId = 1
            };

            Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateCommentAsync(dto, 1));
        }

        [Test]
        public async Task CreateCommentAsync_SetsParentCommentId()
        {
            var dto = new CreateCommentDTO
            {
                Text = "Reply",
                ParentType = "moment",
                ParentId = 10,
                ParentCommentId = 99
            };

            Comment? captured = null;

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                .Callback<Comment>(c => captured = c)
                .Returns(Task.CompletedTask);

            await _service.CreateCommentAsync(dto, 1);

            Assert.That(captured!.ParentCommentId, Is.EqualTo(99));
        }
    }
}