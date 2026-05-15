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
    public class StrideRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private StrideRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new StrideRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetStridesByIterationAsync_ReturnsMatchingStrides()
        {
            var strides = new List<Stride>
            {
                new Stride { Id = 1, Name = "Sprint 1", IterationId = 10 },
                new Stride { Id = 2, Name = "Sprint 2", IterationId = 10 },
                new Stride { Id = 3, Name = "Sprint 3", IterationId = 20 }
            };
            _context.Strides.AddRange(strides);
            await _context.SaveChangesAsync();

            var result = await _repo.GetStridesByIterationAsync(10);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(s => s.IterationId == 10), Is.True);
            Assert.That(list.Select(s => s.Id), Is.EquivalentTo(new[] { 1, 2 }));
        }

        [Test]
        public async Task GetStridesByIterationAsync_NoMatch_ReturnsEmpty()
        {
            _context.Strides.Add(new Stride { Id = 1, IterationId = 99 });
            await _context.SaveChangesAsync();

            var result = await _repo.GetStridesByIterationAsync(100);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetStridesEndingOnAsync_ReturnsStridesWithMatchingEndDate()
        {
            var targetDate = new DateTime(2026, 6, 1, 15, 30, 0); // time part should be ignored
            var strides = new List<Stride>
            {
                new Stride { Id = 1, Name = "Ends on target", EndDate = targetDate },
                new Stride { Id = 2, Name = "Ends earlier", EndDate = new DateTime(2026, 5, 31) },
                new Stride { Id = 3, Name = "Ends later", EndDate = new DateTime(2026, 6, 2) }
            };
            _context.Strides.AddRange(strides);
            await _context.SaveChangesAsync();

            var result = await _repo.GetStridesEndingOnAsync(targetDate);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].Id, Is.EqualTo(1));
        }

        [Test]
        public async Task GetStridesEndingOnAsync_NoMatch_ReturnsEmpty()
        {
            _context.Strides.Add(new Stride { Id = 1, EndDate = new DateTime(2026, 6, 5) });
            await _context.SaveChangesAsync();

            var result = await _repo.GetStridesEndingOnAsync(new DateTime(2026, 6, 1));
            Assert.That(result, Is.Empty);
        }

        // Optional inherited generic method tests
        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var stride = new Stride { Id = 5, Name = "Stride 5", IterationId = 1 };
            _context.Strides.Add(stride);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(5);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var stride = new Stride { Name = "New Stride", IterationId = 2, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(14) };
            await _repo.AddAsync(stride);
            await _context.SaveChangesAsync();
            
            var saved = _context.Strides.FirstOrDefault(s => s.Name == "New Stride");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.IterationId, Is.EqualTo(2));
        }
    }
}