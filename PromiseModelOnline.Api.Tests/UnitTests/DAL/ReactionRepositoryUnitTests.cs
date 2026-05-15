using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class ReactionRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private ReactionRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new ReactionRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        private async Task SeedAsync()
        {
            var user1 = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
            var user2 = new User { Id = 2, Name = "Bob", Email = "bob@example.com" };

            _context.Users.AddRange(user1, user2);

            var reactions = new List<Reaction>
            {
                new Reaction { Id = 1, UserId = 1, Emote = "👍", StackItemType = "Promise", StackItemId = 10, User = user1 },
                new Reaction { Id = 2, UserId = 2, Emote = "❤", StackItemType = "Promise", StackItemId = 10, User = user2 },
                new Reaction { Id = 3, UserId = 1, Emote = "🚀", StackItemType = "Moment", StackItemId = 5, User = user1 },
                new Reaction { Id = 4, UserId = 2, Emote = "👀", StackItemType = "Epic", StackItemId = 20, User = user2 }
            };
            _context.Reactions.AddRange(reactions);
            await _context.SaveChangesAsync();
        }

        [Test]
        public async Task GetReactionsForItemAsync_ReturnsMatchingReactionsWithUser()
        {
            await SeedAsync();

            var result = await _repo.GetReactionsForItemAsync("Promise", 10);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(r => r.StackItemType == "Promise" && r.StackItemId == 10), Is.True);
            Assert.That(list[0].User, Is.Not.Null);
            Assert.That(list[0].User!.Name, Is.EqualTo("Alice"));
        }

        [Test]
        public async Task GetReactionsForItemAsync_NoMatch_ReturnsEmpty()
        {
            await SeedAsync();

            var result = await _repo.GetReactionsForItemAsync("Flow", 99);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetReactionsForItemAsync_EmptyDatabase_ReturnsEmpty()
        {
            var result = await _repo.GetReactionsForItemAsync("Journey", 1);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetUserReactionAsync_ReturnsMatchingReaction()
        {
            await SeedAsync();

            var reaction = await _repo.GetUserReactionAsync(1, "Promise", 10);
            Assert.That(reaction, Is.Not.Null);
            Assert.That(reaction!.Id, Is.EqualTo(1));
            Assert.That(reaction.Emote, Is.EqualTo("👍"));
        }

        [Test]
        public async Task GetUserReactionAsync_DifferentStackItem_ReturnsNull()
        {
            await SeedAsync();

            var reaction = await _repo.GetUserReactionAsync(1, "Epic", 10);
            Assert.That(reaction, Is.Null);
        }

        [Test]
        public async Task GetUserReactionAsync_DifferentUser_ReturnsNull()
        {
            await SeedAsync();

            var reaction = await _repo.GetUserReactionAsync(99, "Promise", 10);
            Assert.That(reaction, Is.Null);
        }

        [Test]
        public async Task GetUserReactionAsync_EmptyDatabase_ReturnsNull()
        {
            var reaction = await _repo.GetUserReactionAsync(1, "Moment", 5);
            Assert.That(reaction, Is.Null);
        }

        // Inherited generic methods
        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            await SeedAsync();

            var result = await _repo.GetByIdAsync(3);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(3));
            Assert.That(result.Emote, Is.EqualTo("🚀"));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var reaction = new Reaction { UserId = 5, Emote = "🎉", StackItemType = "Flow", StackItemId = 15 };
            await _repo.AddAsync(reaction);
            await _context.SaveChangesAsync();
            
            var saved = _context.Reactions.FirstOrDefault(r => r.Emote == "🎉");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.UserId, Is.EqualTo(5));
            Assert.That(saved.StackItemType, Is.EqualTo("Flow"));
            Assert.That(saved.StackItemId, Is.EqualTo(15));
        }
    }
}