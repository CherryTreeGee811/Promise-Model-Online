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
    public class IterationRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private IterationRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new IterationRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetIterationsByProjectAsync_ReturnsMatchingIterations()
        {
            var iterations = new List<Iteration>
            {
                new Iteration { Id = 1, Name = "Sprint 1", ProjectId = 10 },
                new Iteration { Id = 2, Name = "Sprint 2", ProjectId = 20 },
                new Iteration { Id = 3, Name = "Sprint 3", ProjectId = 10 }
            };
            _context.Iterations.AddRange(iterations);
            await _context.SaveChangesAsync();

            var result = await _repo.GetIterationsByProjectAsync(10);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(i => i.ProjectId == 10), Is.True);
            Assert.That(list.Select(i => i.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task GetIterationsByProjectAsync_NoMatch_ReturnsEmpty()
        {
            _context.Iterations.Add(new Iteration { Id = 1, ProjectId = 99 });
            await _context.SaveChangesAsync();

            var result = await _repo.GetIterationsByProjectAsync(100);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetIterationsByProjectAsync_EmptyDatabase_ReturnsEmpty()
        {
            var result = await _repo.GetIterationsByProjectAsync(1);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var iteration = new Iteration { Id = 5, Name = "Iter 5", ProjectId = 1 };
            _context.Iterations.Add(iteration);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(5);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var iteration = new Iteration { Name = "New Iteration", ProjectId = 3 };
            await _repo.AddAsync(iteration);

            var saved = _context.Iterations.FirstOrDefault(i => i.Name == "New Iteration");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.ProjectId, Is.EqualTo(3));
        }
    }
}