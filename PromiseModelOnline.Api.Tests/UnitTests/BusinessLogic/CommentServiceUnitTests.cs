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

        [Test]
        public async Task GetCommentsAsync_ReturnsMappedDtos()
        {
            var comments = new List<Comment>
            {
                new Comment { Id = 1, Text = "Hello" },
                new Comment { Id = 2, Text = "World" }
            };

            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 10))
                           .ReturnsAsync(comments);
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns<Comment, IGenericService<Comment>>((c, _) => new CommentDTO { Id = c.Id, Text = c.Text });

            var result = await _service.GetCommentsAsync("moment", 10);

            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Text, Is.EqualTo("Hello"));
        }

        [Test]
        public async Task GetCommentsAsync_NoComments_ReturnsEmptyList()
        {
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("epic", 5))
                           .ReturnsAsync(new List<Comment>());
            var result = await _service.GetCommentsAsync("epic", 5);
            Assert.That(result, Is.Empty);
        }

        // Helper that sets up the callback capture for all parent-type tests
        private void SetupCommentCreation(string parentType, int parentId)
        {
            Comment? savedComment = null;
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                           .Callback<Comment>(c => savedComment = c)
                           .Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync(parentType, parentId))
                           .ReturnsAsync(() => savedComment != null
                               ? new List<Comment> { savedComment }
                               : new List<Comment>());
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns(new CommentDTO());
        }

        [Test]
        public async Task CreateCommentAsync_ValidMomentParent_CreatesComment()
        {
            var dto = new CreateCommentDTO { Text = "Great work!", ParentType = "moment", ParentId = 42 };
            Comment? savedComment = null;
            _commentRepoMock.Setup(r => r.AddCommentAsync(It.IsAny<Comment>()))
                           .Callback<Comment>(c => savedComment = c)
                           .Returns(Task.CompletedTask);
            _commentRepoMock.Setup(r => r.GetCommentsForEntityAsync("moment", 42))
                           .ReturnsAsync(() => savedComment != null ? new List<Comment> { savedComment } : new List<Comment>());
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns<Comment, IGenericService<Comment>>((c, _) => new CommentDTO { Id = c.Id, Text = c.Text });

            var result = await _service.CreateCommentAsync(dto, 1);

            Assert.That(result.Text, Is.EqualTo("Great work!"));
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.MomentId == 42)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidPromiseParent_SetsProductPromiseId()
        {
            var dto = new CreateCommentDTO { Text = "Nice promise", ParentType = "promise", ParentId = 7 };
            SetupCommentCreation("promise", 7);
            await _service.CreateCommentAsync(dto, 2);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.ProductPromiseId == 7)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidEpicParent_SetsEpicId()
        {
            var dto = new CreateCommentDTO { Text = "Epic", ParentType = "epic", ParentId = 3 };
            SetupCommentCreation("epic", 3);
            await _service.CreateCommentAsync(dto, 1);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.EpicId == 3)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidJourneyParent_SetsJourneyId()
        {
            var dto = new CreateCommentDTO { Text = "Journey", ParentType = "journey", ParentId = 8 };
            SetupCommentCreation("journey", 8);
            await _service.CreateCommentAsync(dto, 1);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.JourneyId == 8)), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_ValidFlowParent_SetsFlowId()
        {
            var dto = new CreateCommentDTO { Text = "Flow", ParentType = "flow", ParentId = 12 };
            SetupCommentCreation("flow", 12);
            await _service.CreateCommentAsync(dto, 1);
            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.FlowId == 12)), Times.Once);
        }

        [Test]
        public void CreateCommentAsync_InvalidParentType_ThrowsArgumentException()
        {
            var dto = new CreateCommentDTO { Text = "Bad", ParentType = "invalid", ParentId = 1 };
            Assert.ThrowsAsync<ArgumentException>(() => _service.CreateCommentAsync(dto, 1));
        }

        [Test]
        public async Task CreateCommentAsync_WithMentions_AddsMentionsAndNotifications()
        {
            var dto = new CreateCommentDTO { Text = "Hey @alice and @bob!", ParentType = "moment", ParentId = 99 };
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
                           .ReturnsAsync(() => savedComment != null ? new List<Comment> { savedComment } : new List<Comment>());
            _mapperMock.Setup(m => m.Map(It.IsAny<Comment>(), null!))
                       .Returns(new CommentDTO());

            await _service.CreateCommentAsync(dto, 1);

            _commentRepoMock.Verify(r => r.AddMentionAsync(It.Is<CommentMention>(m => m.MentionedUserId == 10)), Times.Once);
            _commentRepoMock.Verify(r => r.AddMentionAsync(It.Is<CommentMention>(m => m.MentionedUserId == 20)), Times.Once);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(10, NotificationType.Mention, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(20, NotificationType.Mention, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_WithDuplicateMentions_OnlyAddsOnce()
        {
            var dto = new CreateCommentDTO { Text = "@alice @alice look!", ParentType = "moment", ParentId = 1 };
            var alice = new User { Id = 10, Name = "alice" };
            _userRepoMock.Setup(r => r.GetUsersByNameAsync("alice")).ReturnsAsync(new List<User> { alice });

            SetupCommentCreation("moment", 1);
            _commentRepoMock.Setup(r => r.AddMentionAsync(It.IsAny<CommentMention>())).Returns(Task.CompletedTask);

            await _service.CreateCommentAsync(dto, 1);

            _commentRepoMock.Verify(r => r.AddMentionAsync(It.IsAny<CommentMention>()), Times.Once);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(10, NotificationType.Mention, It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task CreateCommentAsync_MentionedUserNotFound_SkipsMention()
        {
            var dto = new CreateCommentDTO { Text = "Hey @ghost", ParentType = "moment", ParentId = 5 };
            _userRepoMock.Setup(r => r.GetUsersByNameAsync("ghost")).ReturnsAsync(new List<User>());

            SetupCommentCreation("moment", 5);
            await _service.CreateCommentAsync(dto, 1);

            _commentRepoMock.Verify(r => r.AddMentionAsync(It.IsAny<CommentMention>()), Times.Never);
            _notificationServiceMock.Verify(n => n.CreateNotificationAsync(It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task CreateCommentAsync_ParentCommentIdIsSet()
        {
            var dto = new CreateCommentDTO { Text = "Reply", ParentType = "moment", ParentId = 10, ParentCommentId = 5 };

            SetupCommentCreation("moment", 10);
            await _service.CreateCommentAsync(dto, 3);

            _commentRepoMock.Verify(r => r.AddCommentAsync(It.Is<Comment>(c => c.ParentCommentId == 5)), Times.Once);
        }
    }
}