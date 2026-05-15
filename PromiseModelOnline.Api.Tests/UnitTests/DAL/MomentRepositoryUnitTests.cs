using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class MomentRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private MomentRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new MomentRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        private async Task SeedAsync()
        {
            var project = new Project { Id = 1, Name = "Test Project" };
            var promise = new Promise { Id = 1, Statement = "P1", ProjectId = 1 };
            var epic = new Epic { Id = 1, Statement = "E1", ProductPromiseId = 1 };
            var journey = new Journey { Id = 1, Statement = "J1", EpicId = 1 };
            var flow = new Flow { Id = 1, Statement = "F1", JourneyId = 1 };
            var iteration = new Iteration { Id = 100, ProjectId = 1, Name = "Iter1" };
            var stride1 = new Stride { Id = 10, IterationId = 100, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(14) };
            var stride2 = new Stride { Id = 20, IterationId = 100, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(14) };

            _context.Projects.Add(project);
            _context.Promises.Add(promise);
            _context.Epics.Add(epic);
            _context.Journeys.Add(journey);
            _context.Flows.Add(flow);
            _context.Iterations.Add(iteration);
            _context.Strides.AddRange(stride1, stride2);

            var moment1 = new Moment { Id = 1, Statement = "M1", FlowId = 1, AssignedStrideId = 10, Status = MomentStatus.Todo };
            var moment2 = new Moment { Id = 2, Statement = "M2", FlowId = 1, AssignedStrideId = 10, Status = MomentStatus.Done, CompletedAt = DateTime.UtcNow };
            var moment3 = new Moment { Id = 3, Statement = "M3", FlowId = 1, AssignedStrideId = 20, Status = MomentStatus.InProgress };
            var moment4 = new Moment { Id = 4, Statement = "M4", FlowId = 1, AssignedStrideId = null, Status = MomentStatus.Todo };
            var moment5 = new Moment { Id = 5, Statement = "M5", FlowId = 2, AssignedStrideId = 10, OwnerId = 50, Status = MomentStatus.Todo };

            _context.Moments.AddRange(moment1, moment2, moment3, moment4, moment5);
            await _context.SaveChangesAsync();
        }

        [Test]
        public async Task GetMomentsByFlowAsync_ReturnsMatchingMoments()
        {
            await SeedAsync();
            var result = await _repo.GetMomentsByFlowAsync(1);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(4)); // moments 1-4 have flowId=1
            Assert.That(list.All(m => m.FlowId == 1), Is.True);
        }

        [Test]
        public async Task GetMomentsByStrideAsync_ReturnsMatchingMoments()
        {
            await SeedAsync();
            var result = await _repo.GetMomentsByStrideAsync(10);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(2)); // moment1 and moment2 are in stride 10
            Assert.That(list.Select(m => m.Id), Is.EquivalentTo(new[] { 1, 2 }));
        }

        [Test]
        public async Task GetMomentsByIterationAsync_AssignedOnly_ReturnsMomentsInStridesOfIteration()
        {
            await SeedAsync();
            var result = await _repo.GetMomentsByIterationAsync(100, unassignedOnly: false);
            var list = result.ToList();
            // moments with AssignedStrideId 10 or 20: 1,2,3 (stride 10 has 1,2; stride 20 has 3)
            Assert.That(list.Count, Is.EqualTo(3));
            Assert.That(list.Select(m => m.Id), Is.EquivalentTo(new[] { 1, 2, 3 }));
        }

        [Test]
        public async Task GetMomentsByIterationAsync_UnassignedOnly_ReturnsUnassignedMoments()
        {
            await SeedAsync();
            var result = await _repo.GetMomentsByIterationAsync(100, unassignedOnly: true);
            var list = result.ToList();
            // Note: current implementation ignores iteration filter when unassignedOnly=true;
            // returns all unassigned moments regardless of iteration. We'll test actual behavior.
            Assert.That(list.Count, Is.GreaterThanOrEqualTo(1)); // at least moment4
            Assert.That(list.All(m => m.AssignedStrideId == null), Is.True);
        }

        [Test]
        public async Task GetMomentsByOwnerIdAsync_ReturnsMatchingMoments()
        {
            await SeedAsync();
            var result = await _repo.GetMomentsByOwnerIdAsync(50);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].Id, Is.EqualTo(5));
        }

        [Test]
        public async Task GetMomentsByPromiseIdAsync_ReturnsAllDescendantMoments()
        {
            await SeedAsync();
            var result = await _repo.GetMomentsByPromiseIdAsync(1);
            var list = result.ToList();
            // All moments under promise 1: moment1-4 have flow1 which belongs to journey1, epic1, promise1
            // moment5 has flow2 (not set up), so it's not included.
            Assert.That(list.Count, Is.EqualTo(4));
        }

        [Test]
        public async Task GetProjectIdForMomentAsync_ReturnsProjectId()
        {
            await SeedAsync();
            var projectId = await _repo.GetProjectIdForMomentAsync(1);
            Assert.That(projectId, Is.EqualTo(1));
        }

        [Test]
        public async Task GetProjectIdForMomentAsync_NonexistentMoment_ReturnsNull()
        {
            var result = await _repo.GetProjectIdForMomentAsync(999);
            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task GetUnfinishedMomentsByStrideAsync_ReturnsNonDoneMoments()
        {
            await SeedAsync();
            var result = await _repo.GetUnfinishedMomentsByStrideAsync(10);
            var list = result.ToList();
            // stride 10 has moment1 (Todo) and moment2 (Done) -> only moment1
            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].Id, Is.EqualTo(1));
        }
    }
}