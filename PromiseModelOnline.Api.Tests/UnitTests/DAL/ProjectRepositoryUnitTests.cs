using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;
    [TestFixture]
    /// <summary>Unit tests for <see cref="ProjectRepository"/> covering project queries.</summary>
    // Requirements: REQ_FUN_003
    public class ProjectRepositoryUnitTests : RepositoryTestBase
    {
        private ProjectRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _repo = new ProjectRepository(Context);
        }

        [Test]
        public async Task REQ_FUN_003_GetProjectsOwnedByUserAsync_ReturnsMatchingProjects()
        {
            // Arrange
            var projects = new List<Project>
            {
                new Project { Id = 1, Name = "Alpha", Slug = "alpha", OwnerId = 100 },
                new Project { Id = 2, Name = "Beta", Slug = "beta", OwnerId = 200 },
                new Project { Id = 3, Name = "Gamma", Slug = "gamma", OwnerId = 100 }
            };
            Context.Projects.AddRange(projects);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetProjectsOwnedByUserAsync(100);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(p => p.OwnerId == 100), Is.True);
            Assert.That(list.Select(p => p.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task REQ_FUN_003_GetProjectsOwnedByUserAsync_NoMatch_ReturnsEmpty()
        {
            // Arrange
            Context.Projects.Add(new Project { Id = 1, Slug = "test", OwnerId = 99 });
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetProjectsOwnedByUserAsync(100);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_FUN_003_GetProjectsOwnedByUserAsync_EmptyDatabase_ReturnsEmpty()
        {
            // Act
            var result = await _repo.GetProjectsOwnedByUserAsync(1);
            // Assert
            Assert.That(result, Is.Empty);
        }

        // Inherited methods (optional but good for confidence)
        [Test]
        public async Task REQ_FUN_003_GetByIdAsync_ReturnsEntity()
        {
            // Arrange
            var project = new Project { Id = 5, Name = "Test Project", Slug = "test-project", OwnerId = 1 };
            Context.Projects.Add(project);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetByIdAsync(5);
            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Name, Is.EqualTo("Test Project"));
        }

        [Test]
        public async Task REQ_FUN_003_AddAsync_PersistsEntity()
        {
            // Arrange
            var project = new Project { Name = "New Project", Slug = "new-project", OwnerId = 42 };
            // Act
            await _repo.AddAsync(project);
            await Context.SaveChangesAsync();
            
            // Assert
            var saved = Context.Projects.FirstOrDefault(p => p.Name == "New Project");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.OwnerId, Is.EqualTo(42));
        }

        [Test]
        public async Task REQ_FUN_003_DeleteByIdAsync_WithChildPromisesAndProjectChildren_DeletesProjectTree()
        {
            // Arrange
            var project = new Project { Id = 1, Name = "Project A", Slug = "project-a", OwnerId = 10 };
            var promise = new Promise { Id = 2, Statement = "Promise", ProjectId = 1, Project = project };
            var epic = new Epic { Id = 3, Statement = "Epic", ProductPromiseId = 2, ProductPromise = promise };
            var journey = new Journey { Id = 4, Statement = "Journey", EpicId = 3, Epic = epic };
            var flow = new Flow { Id = 5, Statement = "Flow", JourneyId = 4, Journey = journey };
            var moment = new Moment { Id = 6, Statement = "Moment", FlowId = 5, Flow = flow };
            var iteration = new Iteration { Id = 7, Name = "Iteration", ProjectId = 1, Project = project };
            var stride = new Stride { Id = 8, Name = "Stride", IterationId = 7 };
            var permission = new Permission { Id = 9, UserId = 10, ProjectId = 1 };
            var comment = new Comment { Id = 10, UserId = 10, Text = "Moment comment", MomentId = 6 };
            var mention = new CommentMention { Id = 11, CommentId = 10, MentionedUserId = 10 };

            Context.Projects.Add(project);
            Context.Promises.Add(promise);
            Context.Epics.Add(epic);
            Context.Journeys.Add(journey);
            Context.Flows.Add(flow);
            Context.Moments.Add(moment);
            Context.Iterations.Add(iteration);
            Context.Strides.Add(stride);
            Context.Set<Permission>().Add(permission);
            Context.Set<Comment>().Add(comment);
            Context.Set<CommentMention>().Add(mention);
            await Context.SaveChangesAsync();

            // Act
            var deleted = await _repo.DeleteByIdAsync(1);

            // Assert
            Assert.That(deleted, Is.True);
            Assert.That(Context.Projects.Any(), Is.False);
            Assert.That(Context.Promises.Any(), Is.False);
            Assert.That(Context.Epics.Any(), Is.False);
            Assert.That(Context.Journeys.Any(), Is.False);
            Assert.That(Context.Flows.Any(), Is.False);
            Assert.That(Context.Moments.Any(), Is.False);
            Assert.That(Context.Iterations.Any(), Is.False);
            Assert.That(Context.Strides.Any(), Is.False);
            Assert.That(Context.Set<Permission>().Any(), Is.False);
            Assert.That(Context.Set<Comment>().Any(), Is.False);
            Assert.That(Context.Set<CommentMention>().Any(), Is.False);
        }
    }
