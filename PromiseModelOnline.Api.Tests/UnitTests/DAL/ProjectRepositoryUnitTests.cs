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
    public class ProjectRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private ProjectRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new ProjectRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetProjectsOwnedByUserAsync_ReturnsMatchingProjects()
        {
            var projects = new List<Project>
            {
                new Project { Id = 1, Name = "Alpha", OwnerId = 100 },
                new Project { Id = 2, Name = "Beta", OwnerId = 200 },
                new Project { Id = 3, Name = "Gamma", OwnerId = 100 }
            };
            _context.Projects.AddRange(projects);
            await _context.SaveChangesAsync();

            var result = await _repo.GetProjectsOwnedByUserAsync(100);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(p => p.OwnerId == 100), Is.True);
            Assert.That(list.Select(p => p.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task GetProjectsOwnedByUserAsync_NoMatch_ReturnsEmpty()
        {
            _context.Projects.Add(new Project { Id = 1, OwnerId = 99 });
            await _context.SaveChangesAsync();

            var result = await _repo.GetProjectsOwnedByUserAsync(100);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetProjectsOwnedByUserAsync_EmptyDatabase_ReturnsEmpty()
        {
            var result = await _repo.GetProjectsOwnedByUserAsync(1);
            Assert.That(result, Is.Empty);
        }

        // Inherited methods (optional but good for confidence)
        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var project = new Project { Id = 5, Name = "Test Project", OwnerId = 1 };
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(5);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Name, Is.EqualTo("Test Project"));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var project = new Project { Name = "New Project", OwnerId = 42 };
            await _repo.AddAsync(project);
            await _context.SaveChangesAsync();
            
            var saved = _context.Projects.FirstOrDefault(p => p.Name == "New Project");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.OwnerId, Is.EqualTo(42));
        }

        [Test]
        public async Task DeleteByIdAsync_WithChildPromisesAndProjectChildren_DeletesProjectTree()
        {
            var project = new Project { Id = 1, Name = "Project A", OwnerId = 10 };
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

            _context.Projects.Add(project);
            _context.Promises.Add(promise);
            _context.Epics.Add(epic);
            _context.Journeys.Add(journey);
            _context.Flows.Add(flow);
            _context.Moments.Add(moment);
            _context.Iterations.Add(iteration);
            _context.Strides.Add(stride);
            _context.Set<Permission>().Add(permission);
            _context.Set<Comment>().Add(comment);
            _context.Set<CommentMention>().Add(mention);
            await _context.SaveChangesAsync();

            var deleted = await _repo.DeleteByIdAsync(1);

            Assert.That(deleted, Is.True);
            Assert.That(_context.Projects.Any(), Is.False);
            Assert.That(_context.Promises.Any(), Is.False);
            Assert.That(_context.Epics.Any(), Is.False);
            Assert.That(_context.Journeys.Any(), Is.False);
            Assert.That(_context.Flows.Any(), Is.False);
            Assert.That(_context.Moments.Any(), Is.False);
            Assert.That(_context.Iterations.Any(), Is.False);
            Assert.That(_context.Strides.Any(), Is.False);
            Assert.That(_context.Set<Permission>().Any(), Is.False);
            Assert.That(_context.Set<Comment>().Any(), Is.False);
            Assert.That(_context.Set<CommentMention>().Any(), Is.False);
        }
    }
}