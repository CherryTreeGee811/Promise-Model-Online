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
    public class EpicRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private EpicRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new EpicRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetEpicsByPromiseAsync_ReturnsMatchingEpics()
        {
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "E1", ProductPromiseId = 10 },
                new Epic { Id = 2, Statement = "E2", ProductPromiseId = 20 },
                new Epic { Id = 3, Statement = "E3", ProductPromiseId = 10 }
            };
            _context.Epics.AddRange(epics);
            await _context.SaveChangesAsync();

            var result = await _repo.GetEpicsByPromiseAsync(10);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(e => e.ProductPromiseId == 10), Is.True);
            Assert.That(list.Select(e => e.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task GetEpicsByPromiseAsync_NoMatch_ReturnsEmpty()
        {
            _context.Epics.Add(new Epic { Id = 1, ProductPromiseId = 99 });
            await _context.SaveChangesAsync();

            var result = await _repo.GetEpicsByPromiseAsync(100);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetEpicsByPromiseAsync_EmptyDatabase_ReturnsEmpty()
        {
            var result = await _repo.GetEpicsByPromiseAsync(1);
            Assert.That(result, Is.Empty);
        }

        // Optional: test inherited generic methods to ensure base setup works
        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var epic = new Epic { Id = 5, Statement = "Find me" };
            _context.Epics.Add(epic);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(5);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var epic = new Epic { Id = 0, Statement = "New Epic", ProductPromiseId = 1 };
            await _repo.AddAsync(epic);
            await _context.SaveChangesAsync();
            
            var saved = _context.Epics.FirstOrDefault(e => e.Statement == "New Epic");
            Assert.That(saved, Is.Not.Null);
        }
    }
}