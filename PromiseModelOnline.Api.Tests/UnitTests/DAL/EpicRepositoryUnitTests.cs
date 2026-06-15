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
    /// <summary>Unit tests for <see cref="EpicRepository"/> covering epic queries.</summary>
    // Requirements: REQ_FUN_005
    public class EpicRepositoryUnitTests : RepositoryTestBase
    {
        private EpicRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            _repo = new EpicRepository(Context);
        }

        [Test]
        public async Task REQ_FUN_005_GetEpicsByPromiseAsync_ReturnsMatchingEpics()
        {
            // Arrange
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "E1", ProductPromiseId = 10 },
                new Epic { Id = 2, Statement = "E2", ProductPromiseId = 20 },
                new Epic { Id = 3, Statement = "E3", ProductPromiseId = 10 }
            };
            Context.Epics.AddRange(epics);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetEpicsByPromiseAsync(10);
            var list = result.ToList();

            // Assert
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(e => e.ProductPromiseId == 10), Is.True);
            Assert.That(list.Select(e => e.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task REQ_FUN_005_GetEpicsByPromiseAsync_NoMatch_ReturnsEmpty()
        {
            // Arrange
            Context.Epics.Add(new Epic { Id = 1, ProductPromiseId = 99 });
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetEpicsByPromiseAsync(100);
            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task REQ_FUN_005_GetEpicsByPromiseAsync_EmptyDatabase_ReturnsEmpty()
        {
            // Act
            var result = await _repo.GetEpicsByPromiseAsync(1);
            // Assert
            Assert.That(result, Is.Empty);
        }

        // Optional: test inherited generic methods to ensure base setup works
        [Test]
        public async Task REQ_FUN_005_GetByIdAsync_ReturnsEntity()
        {
            // Arrange
            var epic = new Epic { Id = 5, Statement = "Find me" };
            Context.Epics.Add(epic);
            await Context.SaveChangesAsync();

            // Act
            var result = await _repo.GetByIdAsync(5);
            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task REQ_FUN_005_AddAsync_PersistsEntity()
        {
            // Arrange
            var epic = new Epic { Id = 0, Statement = "New Epic", ProductPromiseId = 1 };
            // Act
            await _repo.AddAsync(epic);
            await Context.SaveChangesAsync();
            
            // Assert
            var saved = Context.Epics.FirstOrDefault(e => e.Statement == "New Epic");
            Assert.That(saved, Is.Not.Null);
        }
    }
}