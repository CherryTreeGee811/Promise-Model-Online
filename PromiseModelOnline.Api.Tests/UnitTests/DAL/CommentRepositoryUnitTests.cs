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
            await _repo.AddCommentAsync(comment); // already saves
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
            var user = new User { Id = 1, Email = "a@a.com", Name = "A" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var topLevel = new Comment
            {
                Text = "Top",
                MomentId = parentId,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            var reply = new Comment
            {
                Text = "Reply",
                MomentId = parentId,
                UserId = user.Id,
                ParentCommentId = null,        // will be updated after save
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<Comment>().AddRange(topLevel, reply);
            await _context.SaveChangesAsync();

            // now link the reply to the topLevel (IDs are generated)
            reply.ParentCommentId = topLevel.Id;
            await _context.SaveChangesAsync();

            var result = await _repo.GetCommentsForEntityAsync("moment", parentId);
            var comments = result.ToList();
            Assert.That(comments.Count, Is.EqualTo(1));
            Assert.That(comments[0].Id, Is.EqualTo(topLevel.Id));
        }

        [Test]
        public async Task GetCommentsForEntityAsync_ReturnsCommentsOrderedByDate()
        {
            var parentId = 10;
            var user = new User { Id = 2, Email = "b@b.com", Name = "B" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var older = new Comment
            {
                Text = "Older",
                EpicId = parentId,
                UserId = user.Id,
                CreatedAt = new DateTime(2025, 1, 1)
            };
            var newer = new Comment
            {
                Text = "Newer",
                EpicId = parentId,
                UserId = user.Id,
                CreatedAt = new DateTime(2025, 6, 1)
            };

            _context.Set<Comment>().AddRange(older, newer);
            await _context.SaveChangesAsync();

            var result = await _repo.GetCommentsForEntityAsync("epic", parentId);
            var comments = result.ToList();
            Assert.That(comments.Count, Is.EqualTo(2));
            Assert.That(comments[0].Id, Is.EqualTo(older.Id));   // older first
            Assert.That(comments[1].Id, Is.EqualTo(newer.Id));
        }

        [Test]
        public async Task GetCommentsForEntityAsync_IncludesUserAndMentions()
        {
            var user = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
            var mentioned = new User { Id = 2, Name = "Bob", Email = "bob@example.com" };
            var parentId = 15;
            var comment = new Comment
            {
                Id = 1,
                Text = "Mention @bob",
                ProductPromiseId = parentId,
                UserId = 1,
                User = user,
                CreatedAt = DateTime.UtcNow
            };
            var mention = new CommentMention { Id = 1, CommentId = 1, MentionedUserId = 2, MentionedUser = mentioned };
            comment.Mentions = new List<CommentMention> { mention };

            _context.Set<User>().AddRange(user, mentioned);
            _context.Set<Comment>().Add(comment);
            await _context.SaveChangesAsync();

            var result = await _repo.GetCommentsForEntityAsync("promise", parentId);
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