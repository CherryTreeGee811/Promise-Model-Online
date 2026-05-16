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
    public class ReactionServiceUnitTests
    {
        private Mock<IReactionRepository> _reactionRepoMock = null!;
        private Mock<IGenericMapper<Reaction, ReactionDTO>> _mapperMock = null!;
        private ReactionService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _reactionRepoMock = new Mock<IReactionRepository>();
            _mapperMock = new Mock<IGenericMapper<Reaction, ReactionDTO>>();
            _service = new ReactionService(_reactionRepoMock.Object, _mapperMock.Object);
        }

        #region GetReactionsAsync Tests

        [Test]
        public async Task GetReactionsAsync_ReturnsMappedDtos()
        {
            var reactions = new List<Reaction>
            {
                new Reaction { Id = 1, Emote = "👍", StackItemType = "Promise", StackItemId = 10 },
                new Reaction { Id = 2, Emote = "❤", StackItemType = "Promise", StackItemId = 10 }
            };

            _reactionRepoMock.Setup(r => r.GetReactionsForItemAsync("Promise", 10)).ReturnsAsync(reactions);
            _mapperMock.Setup(m => m.Map(It.IsAny<Reaction>(), null!))
                       .Returns<Reaction, IGenericService<Reaction>>((r, _) => new ReactionDTO
                       {
                           Id = r.Id,
                           Emote = r.Emote,
                           StackItemType = r.StackItemType,
                           StackItemId = r.StackItemId
                       });

            var result = await _service.GetReactionsAsync("Promise", 10);

            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.First().Emote, Is.EqualTo("👍"));
            _reactionRepoMock.Verify(r => r.GetReactionsForItemAsync("Promise", 10), Times.Once);
        }

        [Test]
        public async Task GetReactionsAsync_NoReactions_ReturnsEmpty()
        {
            _reactionRepoMock.Setup(r => r.GetReactionsForItemAsync("Moment", 5)).ReturnsAsync(new List<Reaction>());

            var result = await _service.GetReactionsAsync("Moment", 5);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region CreateReactionAsync / UpdateReactionAsync Tests

        [Test]
        public async Task UpdateReactionAsync_ExistingReaction_UpdatesEmote()
        {
            var existing = new Reaction { Id = 1, UserId = 10, Emote = "👍", StackItemType = "Moment", StackItemId = 5 };
            _reactionRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existing);
            _reactionRepoMock.Setup(r => r.Update(It.IsAny<Reaction>()));
            _reactionRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            _mapperMock.Setup(m => m.Map(existing, null!)).Returns(new ReactionDTO { Id = 1, Emote = "👎" });

            var request = new UpdateReactionRequestDTO { Emote = "👎" };
            var result = await _service.UpdateReactionAsync(1, request, 10);

            Assert.That(result.Emote, Is.EqualTo("👎"));
            Assert.That(existing.Emote, Is.EqualTo("👎"));
            _reactionRepoMock.Verify(r => r.Update(existing), Times.Once);
            _reactionRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
            _reactionRepoMock.Verify(r => r.AddAsync(It.IsAny<Reaction>()), Times.Never);
        }

        [Test]
        public async Task CreateReactionAsync_NoExistingReaction_CreatesNew()
        {
            _reactionRepoMock.Setup(r => r.GetUserReactionAsync(20, "Epic", 3)).ReturnsAsync((Reaction?)null);
            _reactionRepoMock.Setup(r => r.AddAsync(It.IsAny<Reaction>())).Returns(Task.CompletedTask);
            _reactionRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            Reaction? savedReaction = null;
            _reactionRepoMock.Setup(r => r.AddAsync(It.IsAny<Reaction>()))
                             .Callback<Reaction>(r => savedReaction = r)
                             .Returns(Task.CompletedTask);

            _mapperMock.Setup(m => m.Map(It.IsAny<Reaction>(), null!))
                       .Returns<Reaction, IGenericService<Reaction>>((r, _) => new ReactionDTO
                       {
                           Id = r.Id,
                           Emote = r.Emote,
                           StackItemType = r.StackItemType,
                           StackItemId = r.StackItemId
                       });

            var request = new CreateReactionRequest { Emote = "🚀", StackItemType = "Epic", StackItemId = 3 };
            var result = await _service.CreateReactionAsync(request, 20);

            Assert.That(result.Emote, Is.EqualTo("🚀"));
            Assert.That(savedReaction, Is.Not.Null);
            Assert.That(savedReaction!.UserId, Is.EqualTo(20));
            Assert.That(savedReaction.Emote, Is.EqualTo("🚀"));
            Assert.That(savedReaction.StackItemType, Is.EqualTo("Epic"));
            Assert.That(savedReaction.StackItemId, Is.EqualTo(3));
            Assert.That(savedReaction.CreatedAt, Is.Not.EqualTo(default(DateTime)));
            _reactionRepoMock.Verify(r => r.AddAsync(It.IsAny<Reaction>()), Times.Once);
            _reactionRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        #endregion

        #region RemoveReactionAsync Tests

        [Test]
        public void RemoveReactionAsync_NotFound_ThrowsInvalidOperation()
        {
            _reactionRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Reaction?)null);

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.RemoveReactionAsync(99, 1));
        }

        [Test]
        public void RemoveReactionAsync_NotOwner_ThrowsInvalidOperation()
        {
            var reaction = new Reaction { Id = 5, UserId = 100 };
            _reactionRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(reaction);

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.RemoveReactionAsync(5, 999));
        }

        [Test]
        public async Task RemoveReactionAsync_Owner_DeletesReaction()
        {
            var reaction = new Reaction { Id = 7, UserId = 42 };
            _reactionRepoMock.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(reaction);
            _reactionRepoMock.Setup(r => r.DeleteByIdAsync(7)).ReturnsAsync(true);

            await _service.RemoveReactionAsync(7, 42);

            _reactionRepoMock.Verify(r => r.DeleteByIdAsync(7), Times.Once);
        }

        #endregion
    }
}