using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    /// <summary>Unit tests for <see cref="ReactionRepository"/> covering reaction queries.</summary>
    // Requirements: REQ_SYS_004
    public class ReactionRepositoryUnitTests : RepositoryTestBase
    {
        private ReactionRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _repo = new ReactionRepository(Context);
        }

        private async Task SeedAsync()
        {
            var user1 = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
            var user2 = new User { Id = 2, Name = "Bob", Email = "bob@example.com" };

            Context.Users.AddRange(user1, user2);

            var reactions = new List<Reaction>
            {
                new Reaction { Id = 1, UserId = 1, Emote = "👍", StackItemType = "Promise", StackItemId = 10, User = user1 },
                new Reaction { Id = 2, UserId = 2, Emote = "❤", StackItemType = "Promise", StackItemId = 10, User = user2 },
                new Reaction { Id = 3, UserId = 1, Emote = "🚀", StackItemType = "Moment", StackItemId = 5, User = user1 },
                new Reaction { Id = 4, UserId = 2, Emote = "👀", StackItemType = "Epic", StackItemId = 20, User = user2 }
            };
            Context.Reactions.AddRange(reactions);
            await Context.SaveChangesAsync();
        }

        [Test]
        public async Task REQ_SYS_004_GetReactionsForItemAsync_ReturnsMatchingReactionsWithUser()
        {
            // Arrange
            await SeedAsync();

            // Act
            var result = await _repo.GetReactionsForItemAsync("Promise", 10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(r => r.StackItemType == "Promise" && r.StackItemId == 10), Is.True);
            Assert.That(list[0].User, Is.Not.Null);
            Assert.That(list[0].User!.Name, Is.EqualTo("Alice"));
        }

        [Test]
        public async Task REQ_SYS_004_GetReactionsForItemAsync_NoMatch_ReturnsEmpty()
        {
            // Arrange
            await SeedAsync();

            // Act
            var result = await _repo.GetReactionsForItemAsync("Flow", 99);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_SYS_004_GetReactionsForItemAsync_EmptyDatabase_ReturnsEmpty()
        {
            // Act
            var result = await _repo.GetReactionsForItemAsync("Journey", 1);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_SYS_004_GetUserReactionAsync_ReturnsMatchingReaction()
        {
            // Arrange
            await SeedAsync();

            // Act
            var reaction = await _repo.GetUserReactionAsync(1, "Promise", 10);
            // Assert
            Assert.That(reaction, Is.Not.Null);
            Assert.That(reaction!.Id, Is.EqualTo(1));
            Assert.That(reaction.Emote, Is.EqualTo("👍"));
        }

        [Test]
        public async Task REQ_SYS_004_GetUserReactionAsync_DifferentStackItem_ReturnsNull()
        {
            // Arrange
            await SeedAsync();

            // Act
            var reaction = await _repo.GetUserReactionAsync(1, "Epic", 10);
            // Assert
            Assert.That(reaction, Is.Null);
        }

        [Test]
        public async Task REQ_SYS_004_GetUserReactionAsync_DifferentUser_ReturnsNull()
        {
            // Arrange
            await SeedAsync();

            // Act
            var reaction = await _repo.GetUserReactionAsync(99, "Promise", 10);
            // Assert
            Assert.That(reaction, Is.Null);
        }

        [Test]
        public async Task REQ_SYS_004_GetUserReactionAsync_EmptyDatabase_ReturnsNull()
        {
            // Act
            var reaction = await _repo.GetUserReactionAsync(1, "Moment", 5);
            // Assert
            Assert.That(reaction, Is.Null);
        }

        // Inherited generic methods
        [Test]
        public async Task REQ_SYS_004_GetByIdAsync_ReturnsEntity()
        {
            // Arrange
            await SeedAsync();

            // Act
            var result = await _repo.GetByIdAsync(3);
            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(3));
            Assert.That(result.Emote, Is.EqualTo("🚀"));
        }

        [Test]
        public async Task REQ_SYS_004_AddAsync_PersistsEntity()
        {
            // Arrange
            var reaction = new Reaction { UserId = 5, Emote = "🎉", StackItemType = "Flow", StackItemId = 15 };
            // Act
            await _repo.AddAsync(reaction);
            await Context.SaveChangesAsync();
            
            // Assert
            var saved = Context.Reactions.FirstOrDefault(r => r.Emote == "🎉");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.UserId, Is.EqualTo(5));
            Assert.That(saved.StackItemType, Is.EqualTo("Flow"));
            Assert.That(saved.StackItemId, Is.EqualTo(15));
        }
    }
}