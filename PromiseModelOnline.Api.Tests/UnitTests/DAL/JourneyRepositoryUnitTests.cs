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
    /// <summary>Unit tests for <see cref="JourneyRepository"/> covering journey queries.</summary>
    // Requirements: REQ_FUN_006
    public class JourneyRepositoryUnitTests : RepositoryTestBase
    {
        private JourneyRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _repo = new JourneyRepository(Context);
        }

        [Test]
        public async Task REQ_FUN_006_GetJourneysByEpicAsync_ReturnsMatchingJourneys()
        {
            // Arrange
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Onboarding", EpicId = 10 },
                new Journey { Id = 2, Statement = "Settings", EpicId = 20 },
                new Journey { Id = 3, Statement = "Profile", EpicId = 10 }
            };
            Context.Journeys.AddRange(journeys);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetJourneysByEpicAsync(10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(j => j.EpicId == 10), Is.True);
            Assert.That(list.Select(j => j.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task REQ_FUN_006_GetJourneysByEpicAsync_NoMatch_ReturnsEmpty()
        {
            // Arrange
            Context.Journeys.Add(new Journey { Id = 1, EpicId = 99 });
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetJourneysByEpicAsync(100);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_FUN_006_GetJourneysByEpicAsync_EmptyDatabase_ReturnsEmpty()
        {
            // Act
            var result = await _repo.GetJourneysByEpicAsync(1);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_FUN_006_GetByIdAsync_ReturnsEntity()
        {
            // Arrange
            var journey = new Journey { Id = 5, Statement = "Test Journey", EpicId = 1 };
            Context.Journeys.Add(journey);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetByIdAsync(5);
            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task REQ_FUN_006_AddAsync_PersistsEntity()
        {
            // Arrange
            var journey = new Journey { Statement = "New Journey", EpicId = 2 };
            // Act
            await _repo.AddAsync(journey);
            await Context.SaveChangesAsync();
            
            // Assert
            var saved = Context.Journeys.FirstOrDefault(j => j.Statement == "New Journey");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.EpicId, Is.EqualTo(2));
        }
    }
}