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
    public class CommentRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private CommentRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new CommentRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task AddCommentAsync_PersistsComment()
        {
            var comment = new Comment { Text = "Hello", UserId = 1, CreatedAt = DateTime.UtcNow };

            await _repo.AddCommentAsync(comment);

            var saved = await _context.Set<Comment>().FirstOrDefaultAsync(c => c.Text == "Hello");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.Text, Is.EqualTo("Hello"));
        }

        [Test]
        public async Task AddMentionAsync_PersistsMention()
        {
            var mention = new CommentMention { CommentId = 10, MentionedUserId = 20 };

            await _repo.AddMentionAsync(mention);

            var saved = await _context.Set<CommentMention>().FirstOrDefaultAsync(m => m.CommentId == 10);
            Assert.That(saved, Is.Not.Null);
        }

        [Test]
        public async Task GetCommentsForEntityAsync_ReturnsTopLevelCommentsOnly()
        {
            var parentId = 5;
            var parentType = "moment";

            var topLevel = new Comment { Id = 1, Text = "Top", MomentId = parentId, CreatedAt = DateTime.UtcNow.AddDays(-1) };
            var reply = new Comment { Id = 2, Text = "Reply", MomentId = parentId, ParentCommentId = 1, CreatedAt = DateTime.UtcNow };

            _context.Set<Comment>().AddRange(topLevel, reply);
            await _context.SaveChangesAsync();

            var result = await _repo.GetCommentsForEntityAsync(parentType, parentId);
            var comments = result.ToList();

            Assert.That(comments.Count, Is.EqualTo(1));
            Assert.That(comments[0].Id, Is.EqualTo(1));
        }

        [Test]
        public async Task GetCommentsForEntityAsync_ReturnsCommentsOrderedByDate()
        {
            var parentId = 10;
            var parentType = "epic";

            var c1 = new Comment { Id = 1, Text = "Older", EpicId = parentId, CreatedAt = new DateTime(2025, 1, 1) };
            var c2 = new Comment { Id = 2, Text = "Newer", EpicId = parentId, CreatedAt = new DateTime(2025, 6, 1) };

            _context.Set<Comment>().AddRange(c1, c2);
            await _context.SaveChangesAsync();

            var result = await _repo.GetCommentsForEntityAsync(parentType, parentId);
            var comments = result.ToList();

            Assert.That(comments.Count, Is.EqualTo(2));
            Assert.That(comments[0].Id, Is.EqualTo(1)); // older first
            Assert.That(comments[1].Id, Is.EqualTo(2));
        }

        [Test]
        public async Task GetCommentsForEntityAsync_IncludesUserAndMentions()
        {
            var user = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
            var parentId = 15;
            var parentType = "promise";

            var comment = new Comment { Id = 1, Text = "Mention @bob", ProductPromiseId = parentId, UserId = 1, User = user, CreatedAt = DateTime.UtcNow };
            var mention = new CommentMention { Id = 1, CommentId = 1, MentionedUserId = 2, MentionedUser = new User { Id = 2, Name = "Bob", Email = "bob@example.com" } };
            comment.Mentions = new List<CommentMention> { mention };

            _context.Set<User>().AddRange(user, mention.MentionedUser);
            _context.Set<Comment>().Add(comment);
            await _context.SaveChangesAsync();

            var result = await _repo.GetCommentsForEntityAsync(parentType, parentId);
            var comments = result.ToList();

            Assert.That(comments.Count, Is.EqualTo(1));
            Assert.That(comments[0].User, Is.Not.Null);
            Assert.That(comments[0].User!.Name, Is.EqualTo("Alice"));
            Assert.That(comments[0].Mentions.Count, Is.EqualTo(1));
            Assert.That(comments[0].Mentions.First().MentionedUser!.Name, Is.EqualTo("Bob"));
        }

        [Test]
        public void GetCommentsForEntityAsync_InvalidParentType_ThrowsArgumentException()
        {
            Assert.ThrowsAsync<ArgumentException>(() => _repo.GetCommentsForEntityAsync("invalid", 1));
        }

        [Test]
        public async Task GetCommentsForEntityAsync_NoComments_ReturnsEmptyList()
        {
            var result = await _repo.GetCommentsForEntityAsync("journey", 99);
            Assert.That(result, Is.Empty);
        }
    }
}