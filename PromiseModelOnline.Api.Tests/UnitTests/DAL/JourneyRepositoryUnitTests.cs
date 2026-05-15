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
    public class JourneyRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private JourneyRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new JourneyRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetJourneysByEpicAsync_ReturnsMatchingJourneys()
        {
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Onboarding", EpicId = 10 },
                new Journey { Id = 2, Statement = "Settings", EpicId = 20 },
                new Journey { Id = 3, Statement = "Profile", EpicId = 10 }
            };
            _context.Journeys.AddRange(journeys);
            await _context.SaveChangesAsync();

            var result = await _repo.GetJourneysByEpicAsync(10);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(j => j.EpicId == 10), Is.True);
            Assert.That(list.Select(e => e.Id), Is.EquivalentTo(new[] { 1, 3 }));(new[] { 1, 3 }, list.Select(j => j.Id));
        }

        [Test]
        public async Task GetJourneysByEpicAsync_NoMatch_ReturnsEmpty()
        {
            _context.Journeys.Add(new Journey { Id = 1, EpicId = 99 });
            await _context.SaveChangesAsync();

            var result = await _repo.GetJourneysByEpicAsync(100);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetJourneysByEpicAsync_EmptyDatabase_ReturnsEmpty()
        {
            var result = await _repo.GetJourneysByEpicAsync(1);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var journey = new Journey { Id = 5, Statement = "Test Journey", EpicId = 1 };
            _context.Journeys.Add(journey);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(5);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var journey = new Journey { Statement = "New Journey", EpicId = 2 };
            await _repo.AddAsync(journey);

            var saved = _context.Journeys.FirstOrDefault(j => j.Statement == "New Journey");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.EpicId, Is.EqualTo(2));
        }
    }
}