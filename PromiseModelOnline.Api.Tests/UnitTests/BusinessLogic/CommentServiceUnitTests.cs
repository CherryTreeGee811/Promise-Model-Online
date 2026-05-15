using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class CommentServiceUnitTests
    {
        private Mock<ICommentRepository> _commentRepoMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IGenericMapper<Comment, CommentDTO>> _mapperMock = null!;
        private Mock<INotificationService> _notificationServiceMock = null!;
        private CommentService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _commentRepoMock = new Mock<ICommentRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IGenericMapper<Comment, CommentDTO>>();
            _notificationServiceMock = new Mock<INotificationService>();

            _service = new CommentService(
                _commentRepoMock.Object,
                _userRepoMock.Object,
                _mapperMock.Object,
                _notificationServiceMock.Object);
        }

        #region GetCommentsAsync Tests

        [Test]
        public async Task GetCommentsAsync_ReturnsMappedDtos()
        {
            // Arrange
            var comments = new List<Comment>
            {
                new Comment { Id = 1, Text = "Hello" },
                new Comment { Id = 2, Text = "World" }
            };

            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 10))
                           .ReturnsAsync(comments);

            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns<Comment, IGenericService<Comment>>((c, _) => new CommentDTO { Id = c.Id, Text = c.Text });

            // Act
            var result = await _service.GetCommentsAsync("moment", 10);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Text, Is.EqualTo("Hello"));
            _commentRepoMock.Verify(r => r.GetCommentsForEntityAsync("moment", 10), Times.Once);
        }

        [Test]
        public async Task GetCommentsAsync_NoComments_ReturnsEmptyList()
        {
            // Arrange
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("epic", 5))
                           .ReturnsAsync(new List<Comment>());

            // Act
            var result = await _service.GetCommentsAsync("epic", 5);

            // Assert
            Assert.That(result, Is.Empty);
        }

        #endregion

        #region CreateCommentAsync Tests

        [Test]
        public async Task CreateCommentAsync_ValidMomentParent_CreatesComment()
        {
            // Arrange
            var dto = new CreateCommentDTO
            {
                Text = "Great work!",
                ParentType = "moment",
                ParentId = 42
            };

            Comment? savedComment = null;
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                           .Callback<Comment>(c => savedComment = c)
                           .Returns(Task.CompletedTask);

            // After AddCommentAsync, the repository should return the comment when queried
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 42))
                           .ReturnsAsync(() => savedComment != null
                               ? new List<Comment> { savedComment }
                               : new List<Comment>());

            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns<Comment, IGenericService<Comment>>((c, _) => new CommentDTO { Id = c.Id, Text = c.Text });

            // Act
            var result = await _service.CreateCommentAsync(dto, 1);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Text, Is.EqualTo("Great work!"));
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.MomentId == 42)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidPromiseParent_SetsProductPromiseId()
        {
            // Arrange
            var dto = new CreateCommentDTO { Text = "Nice promise", ParentType = "promise", ParentId = 7 };

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("promise", 7))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 5, Text = "Nice promise", ProductPromiseId = 7 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns<Comment, IGenericService<Comment>>((c, _) => new CommentDTO { Id = c.Id, Text = c.Text });

            // Act
            await _service.CreateCommentAsync(dto, 2);

            // Assert
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.ProductPromiseId == 7)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidEpicParent_SetsEpicId()
        {
            var dto = new CreateCommentDTO { Text = "Epic comment", ParentType = "epic", ParentId = 3 };
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("epic", 3))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 1, EpicId = 3 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!)).Returns(new CommentDTO());

            await _service.CreateCommentAsync(dto, 1);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.EpicId == 3)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidJourneyParent_SetsJourneyId()
        {
            var dto = new CreateCommentDTO { Text = "Journey", ParentType = "journey", ParentId = 8 };
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("journey", 8))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 1, JourneyId = 8 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!)).Returns(new CommentDTO());

            await _service.CreateCommentAsync(dto, 1);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.JourneyId == 8)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidFlowParent_SetsFlowId()
        {
            var dto = new CreateCommentDTO { Text = "Flow", ParentType = "flow", ParentId = 12 };
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("flow", 12))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 1, FlowId = 12 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!)).Returns(new CommentDTO());

            await _service.CreateCommentAsync(dto, 1);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.FlowId == 12)), Times.Once);
        }

        [Test]
        public void CreateCommentAsync_InvalidParentType_ThrowsArgumentException()
        {
            // Arrange
            var dto = new CreateCommentDTO { Text = "Bad", ParentType = "invalid", ParentId = 1 };

            // Act + Assert
            Assert.ThrowsAsync<ArgumentException>(() => _service.CreateCommentAsync(dto, 1));
        }

        [Test]
        public async Task CreateCommentAsync_WithMentions_AddsMentionsAndNotifications()
        {
            // Arrange
            var dto = new CreateCommentDTO
            {
                Text = "Hey @alice and @bob, check this out!",
                ParentType = "moment",
                ParentId = 99
            };

            var alice = new User { Id = 10, Name = "alice" };
            var bob = new User { Id = 20, Name = "bob" };

            _userRepoMock.Setup(r => r.GetUsersByNameAsync("alice")).ReturnsAsync(new List<User> { alice });
            _userRepoMock.Setup(r => r.GetUsersByNameAsync("bob")).ReturnsAsync(new List<User> { bob });

            Comment? savedComment = null;
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                           .Callback<Comment>(c => savedComment = c)
                           .Returns(Task.CompletedTask);

            _commentRepoMock.Setup(r => r.AddMentionAsync(It.IsAny<CommentMention>())).Returns(Task.CompletedTask);

            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 99))
                           .ReturnsAsync(() => savedComment != null
                               ? new List<Comment> { savedComment }
                               : new List<Comment>());

            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns<Comment, IGenericService<Comment>>((c, _) => new CommentDTO { Id = c.Id, Text = c.Text });

            // Act
            await _service.CreateCommentAsync(dto, 1);

            // Assert
            _commentRepoMock.Verify(r => r.AddMentionAsync(It.Is<CommentMention>(m => m.MentionedUserId == 10)), Times.Once);
            _commentRepoMock.Verify(r => r.AddMentionAsync(It.Is<CommentMention>(m => m.MentionedUserId == 20)), Times.Once);

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                10, NotificationType.Mention,
                It.Is<string>(s => s.Contains("alice") || s.Contains("mentioned")),
                It.IsAny<string>()), Times.Once);

            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                20, NotificationType.Mention,
                It.Is<string>(s => s.Contains("bob") || s.Contains("mentioned")),
                It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_WithDuplicateMentions_OnlyAddsOnce()
        {
            // Arrange
            var dto = new CreateCommentDTO
            {
                Text = "@alice @alice look!",
                ParentType = "moment",
                ParentId = 1
            };

            var alice = new User { Id = 10, Name = "alice" };
            _userRepoMock.Setup(r => r.GetUsersByNameAsync("alice")).ReturnsAsync(new List<User> { alice });

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.AddMentionAsync(It.IsAny<CommentMention>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 1))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 1 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!)).Returns(new CommentDTO());

            // Act
            await _service.CreateCommentAsync(dto, 1);

            // Assert: mention added only once for alice
            _commentRepoMock.Verify(r => r.AddMentionAsync(It.IsAny<CommentMention>()), Times.Once);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                10, NotificationType.Mention, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_MentionedUserNotFound_SkipsMention()
        {
            // Arrange
            var dto = new CreateCommentDTO
            {
                Text = "Hey @ghost what's up?",
                ParentType = "moment",
                ParentId = 5
            };

            _userRepoMock.Setup(r => r.GetUsersByNameAsync("ghost")).ReturnsAsync(new List<User>());

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 5))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 2 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!)).Returns(new CommentDTO());

            // Act
            await _service.CreateCommentAsync(dto, 1);

            // Assert
            _commentRepoMock.Verify(r => r.AddMentionAsync(It.IsAny<CommentMention>()), Times.Never);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(
                It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task CreateCommentAsync_ParentCommentIdIsSet()
        {
            // Arrange
            var dto = new CreateCommentDTO
            {
                Text = "Reply",
                ParentType = "moment",
                ParentId = 10,
                ParentCommentId = 5
            };

            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>())).Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 10))
                           .ReturnsAsync(new List<Comment> { new Comment { Id = 99, ParentCommentId = 5 } });
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!)).Returns(new CommentDTO());

            // Act
            await _service.CreateCommentAsync(dto, 3);

            // Assert
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.ParentCommentId == 5)), Times.Once);
        }

        #endregion
    }
}