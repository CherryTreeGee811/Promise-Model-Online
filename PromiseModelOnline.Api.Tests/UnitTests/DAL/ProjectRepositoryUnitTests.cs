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
            Assert.That(list.Select(e => e.Id), Is.EquivalentTo(new[] { 1, 3 }));(new[] { 1, 3 }, list.Select(p => p.Id));
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

            var saved = _context.Projects.FirstOrDefault(p => p.Name == "New Project");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.OwnerId, Is.EqualTo(42));
        }
    }
}