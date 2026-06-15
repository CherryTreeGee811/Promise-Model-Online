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
    /// <summary>Unit tests for <see cref="CommentRepository"/> covering CRUD, mentions, and stack search.</summary>
    // Requirements: REQ_FUN_017
    public class CommentRepositoryUnitTests : RepositoryTestBase
    {
        private CommentRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _repo = new CommentRepository(Context);
        }

        [Test]
        public async Task REQ_FUN_017_AddCommentAsync_PersistsComment()
        {
            // Arrange
            var comment = new Comment { Text = "Hello", UserId = 1, CreatedAt = DateTime.UtcNow };
            // Act
            await _repo.AddCommentAsync(comment); // already saves
            // Assert
            var saved = await Context.Set<Comment>().FirstOrDefaultAsync(c => c.Text == "Hello");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.Text, Is.EqualTo("Hello"));
        }

        [Test]
        public async Task REQ_FUN_017_AddMentionAsync_PersistsMention()
        {
            // Arrange
            var mention = new CommentMention { CommentId = 10, MentionedUserId = 20 };
            // Act
            await _repo.AddMentionAsync(mention);
            // Assert
            var saved = await Context.Set<CommentMention>().FirstOrDefaultAsync(m => m.CommentId == 10);
            Assert.That(saved, Is.Not.Null);
        }

        [Test]
        public async Task REQ_FUN_017_GetCommentsForEntityAsync_ReturnsTopLevelCommentsOnly()
        {
            // Arrange
            var parentId = 5;
            var user = new User { Id = 1, Email = "a@a.com", Name = "A" };
            Context.Users.Add(user);
            await Context.SaveChangesAsync();

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

            Context.Set<Comment>().AddRange(topLevel, reply);
            await Context.SaveChangesAsync();

            // now link the reply to the topLevel (IDs are generated)
            reply.ParentCommentId = topLevel.Id;
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetCommentsForEntityAsync("moment", parentId);
            var comments = result.ToList();
            // Assert
            Assert.That(comments.Count, Is.EqualTo(1));
            Assert.That(comments[0].Id, Is.EqualTo(topLevel.Id));
        }

        [Test]
        public async Task REQ_FUN_017_GetCommentsForEntityAsync_ReturnsCommentsOrderedByDate()
        {
            // Arrange
            var parentId = 10;
            var user = new User { Id = 2, Email = "b@b.com", Name = "B" };
            Context.Users.Add(user);
            await Context.SaveChangesAsync();

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

            Context.Set<Comment>().AddRange(older, newer);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetCommentsForEntityAsync("epic", parentId);
            var comments = result.ToList();
            // Assert
            Assert.That(comments.Count, Is.EqualTo(2));
            Assert.That(comments[0].Id, Is.EqualTo(older.Id));   // older first
            Assert.That(comments[1].Id, Is.EqualTo(newer.Id));
        }

        [Test]
        public async Task REQ_FUN_017_GetCommentsForEntityAsync_IncludesUserAndMentions()
        {
            // Arrange
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

            Context.Set<User>().AddRange(user, mentioned);
            Context.Set<Comment>().Add(comment);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetCommentsForEntityAsync("promise", parentId);
            var comments = result.ToList();
            // Assert
            Assert.That(comments.Count, Is.EqualTo(1));
            Assert.That(comments[0].User, Is.Not.Null);
            Assert.That(comments[0].User!.Name, Is.EqualTo("Alice"));
            Assert.That(comments[0].Mentions.Count, Is.EqualTo(1));
            Assert.That(comments[0].Mentions.First().MentionedUser!.Name, Is.EqualTo("Bob"));
        }

        [Test]
        public void REQ_FUN_017_GetCommentsForEntityAsync_InvalidParentType_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(() => _repo.GetCommentsForEntityAsync("invalid", 1));
        }

        [Test]
        public async Task REQ_FUN_017_GetCommentsForEntityAsync_NoComments_ReturnsEmptyList()
        {
            // Act
            var result = await _repo.GetCommentsForEntityAsync("journey", 99);
            // Assert
            Assert.That(result, Is.Empty);
        }

        #region SearchStackByStatementAsync

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_SearchesAllLevels()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Test", OwnerId = 1 };
            Context.Projects.Add(project);

            var promise = new Promise { Id = 10, ProjectId = 1, Statement = "Payment processing" };
            var epic = new Epic { Id = 20, ProductPromiseId = 10, Statement = "Checkout flow" };
            var journey = new Journey { Id = 30, EpicId = 20, Statement = "Mobile checkout" };
            var flow = new Flow { Id = 40, JourneyId = 30, Statement = "Payment form" };
            var moment = new Moment { Id = 50, FlowId = 40, Statement = "Credit card entry" };

            Context.AddRange(promise, epic, journey, flow, moment);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "pay", 10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.Any(r => r.EntityType == "promise" && r.Id == 10), Is.True);
            Assert.That(list.Any(r => r.EntityType == "flow" && r.Id == 40), Is.True);
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_FiltersByProject()
        {
            // Arrange
            var projectA = new Project { Id = 10, Name = "Project A", OwnerId = 1 };
            var projectB = new Project { Id = 11, Name = "Project B", OwnerId = 1 };
            Context.AddRange(projectA, projectB);

            var promiseA = new Promise { Id = 100, ProjectId = 10, Statement = "Login feature" };
            var promiseB = new Promise { Id = 101, ProjectId = 11, Statement = "Login feature" };
            Context.AddRange(promiseA, promiseB);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(10, "login", 10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].Id, Is.EqualTo(100));
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_NoMatch_ReturnsEmpty()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Test", OwnerId = 1 };
            Context.Projects.Add(project);

            var promise = new Promise { Id = 1, ProjectId = 1, Statement = "Billing" };
            Context.Promises.Add(promise);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "nonexistent", 10);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_EmptySearch_ReturnsEmpty()
        {
            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "", 5);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_RespectsMaxResults()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Test", OwnerId = 1 };
            Context.Projects.Add(project);

            for (int i = 1; i <= 10; i++)
            {
                Context.Promises.Add(new Promise { Id = i, ProjectId = 1, Statement = "Same statement" });
            }
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "same", 3);
            // Assert
            Assert.That(result.Count(), Is.EqualTo(3));
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_IncludesAllEntityTypes()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Test", OwnerId = 1 };
            Context.Projects.Add(project);

            var promise = new Promise { Id = 1, ProjectId = 1, Statement = "Alpha" };
            var epic = new Epic { Id = 2, ProductPromiseId = 1, Statement = "Beta" };
            var journey = new Journey { Id = 3, EpicId = 2, Statement = "Gamma" };
            var flow = new Flow { Id = 4, JourneyId = 3, Statement = "Without" };
            var moment = new Moment { Id = 5, FlowId = 4, Statement = "Epsilon" };

            Context.AddRange(promise, epic, journey, flow, moment);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "", 10);
            // Assert
            Assert.That(result, Is.Empty);

            // Act
            result = await _repo.SearchStackByStatementAsync(1, "a", 10);
            var list = result.ToList();
            // Assert
            Assert.That(list.Count, Is.EqualTo(3));
            Assert.That(list.Any(r => r.EntityType == "promise"), Is.True);
            Assert.That(list.Any(r => r.EntityType == "epic"), Is.True);
            Assert.That(list.Any(r => r.EntityType == "journey"), Is.True);
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_MatchesEntityReferencePattern()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Test", OwnerId = 1 };
            Context.Projects.Add(project);

            var promise = new Promise { Id = 10, ProjectId = 1, Statement = "Payment processing", SequenceNumber = 1 };
            var promise2 = new Promise { Id = 11, ProjectId = 1, Statement = "User login", SequenceNumber = 2 };
            var epic = new Epic { Id = 20, ProductPromiseId = 10, Statement = "Checkout flow", SequenceNumber = 1 };
            var journey = new Journey { Id = 30, EpicId = 20, Statement = "Mobile checkout", SequenceNumber = 3 };
            var flow = new Flow { Id = 40, JourneyId = 30, Statement = "Payment form", SequenceNumber = 7 };

            Context.AddRange(promise, promise2, epic, journey, flow);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "promise-1", 10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].EntityType, Is.EqualTo("promise"));
            Assert.That(list[0].Id, Is.EqualTo(10));
            Assert.That(list[0].SequenceNumber, Is.EqualTo(1));
        }

        [Test]
        public async Task REQ_FUN_017_SearchStackByStatementAsync_EntityPatternOnlyMatchesCorrectType()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Test", OwnerId = 1 };
            Context.Projects.Add(project);

            var promise = new Promise { Id = 10, ProjectId = 1, Statement = "Payment processing", SequenceNumber = 1 };
            var epic = new Epic { Id = 20, ProductPromiseId = 10, Statement = "Checkout flow", SequenceNumber = 1 };

            Context.AddRange(promise, epic);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.SearchStackByStatementAsync(1, "epic-1", 10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].EntityType, Is.EqualTo("epic"));
        }

        #endregion

        #region ResolveProjectIdAsync

        [Test]
        public async Task REQ_FUN_017_ResolveProjectIdAsync_ForPromise_ReturnsProjectId()
        {
            // Arrange
            var project = new Project { Id = 7, Name = "P", OwnerId = 1 };
            Context.Projects.Add(project);
            Context.Promises.Add(new Promise { Id = 1, ProjectId = 7, Statement = "Test" });
            await Context.SaveChangesAsync();

            // Act
            var projectId = await _repo.ResolveProjectIdAsync("promise", 1);
            // Assert
            Assert.That(projectId, Is.EqualTo(7));
        }

        [Test]
        public async Task REQ_FUN_017_ResolveProjectIdAsync_ForEpic_ReturnsProjectId()
        {
            // Arrange
            var project = new Project { Id = 8, Name = "P", OwnerId = 1 };
            Context.Projects.Add(project);
            var promise = new Promise { Id = 2, ProjectId = 8, Statement = "Test" };
            Context.Promises.Add(promise);
            Context.Epics.Add(new Epic { Id = 3, ProductPromiseId = 2, Statement = "Test" });
            await Context.SaveChangesAsync();

            // Act
            var projectId = await _repo.ResolveProjectIdAsync("epic", 3);
            // Assert
            Assert.That(projectId, Is.EqualTo(8));
        }

        [Test]
        public async Task REQ_FUN_017_ResolveProjectIdAsync_ForJourney_ReturnsProjectId()
        {
            // Arrange
            var project = new Project { Id = 9, Name = "P", OwnerId = 1 };
            Context.Projects.Add(project);
            var promise = new Promise { Id = 4, ProjectId = 9, Statement = "Test" };
            var epic = new Epic { Id = 5, ProductPromiseId = 4, Statement = "Test" };
            Context.Promises.Add(promise);
            Context.Epics.Add(epic);
            Context.Journeys.Add(new Journey { Id = 6, EpicId = 5, Statement = "Test" });
            await Context.SaveChangesAsync();

            // Act
            var projectId = await _repo.ResolveProjectIdAsync("journey", 6);
            // Assert
            Assert.That(projectId, Is.EqualTo(9));
        }

        [Test]
        public async Task REQ_FUN_017_ResolveProjectIdAsync_ForFlow_ReturnsProjectId()
        {
            // Arrange
            var project = new Project { Id = 10, Name = "P", OwnerId = 1 };
            Context.Projects.Add(project);
            var promise = new Promise { Id = 7, ProjectId = 10, Statement = "Test" };
            var epic = new Epic { Id = 8, ProductPromiseId = 7, Statement = "Test" };
            var journey = new Journey { Id = 9, EpicId = 8, Statement = "Test" };
            Context.AddRange(project, promise, epic, journey);
            Context.Flows.Add(new Flow { Id = 10, JourneyId = 9, Statement = "Test" });
            await Context.SaveChangesAsync();

            // Act
            var projectId = await _repo.ResolveProjectIdAsync("flow", 10);
            // Assert
            Assert.That(projectId, Is.EqualTo(10));
        }

        [Test]
        public async Task REQ_FUN_017_ResolveProjectIdAsync_ForMoment_ReturnsProjectId()
        {
            // Arrange
            var project = new Project { Id = 11, Name = "P", OwnerId = 1 };
            Context.Projects.Add(project);
            var promise = new Promise { Id = 11, ProjectId = 11, Statement = "Test" };
            var epic = new Epic { Id = 12, ProductPromiseId = 11, Statement = "Test" };
            var journey = new Journey { Id = 13, EpicId = 12, Statement = "Test" };
            var flow = new Flow { Id = 14, JourneyId = 13, Statement = "Test" };
            Context.AddRange(project, promise, epic, journey, flow);
            Context.Moments.Add(new Moment { Id = 15, FlowId = 14, Statement = "Test" });
            await Context.SaveChangesAsync();

            // Act
            var projectId = await _repo.ResolveProjectIdAsync("moment", 15);
            // Assert
            Assert.That(projectId, Is.EqualTo(11));
        }

        [Test]
        public void REQ_FUN_017_ResolveProjectIdAsync_InvalidType_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(() => _repo.ResolveProjectIdAsync("invalid", 1));
        }

        [Test]
        public void REQ_FUN_017_ResolveProjectIdAsync_NonExistentEntity_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(() => _repo.ResolveProjectIdAsync("promise", 999));
        }

        #endregion
    }
}