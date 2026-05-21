using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class HierarchyStatusServiceUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private HierarchyStatusService _service = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new PromiseModelOnlineContext(options);
            _service = new HierarchyStatusService(
                new GenericRepository<Promise>(_context),
                new EpicRepository(_context),
                new JourneyRepository(_context),
                new FlowRepository(_context),
                new MomentRepository(_context));
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task RecalculateFromFlowAsync_RollsStatusesUpThroughHierarchy()
        {
            var project = new Project { Id = 1, Name = "Project" };
            var promise = new Promise { Id = 1, Statement = "Promise", ProjectId = 1, Project = project, StatusColor = StatusColorRules.Todo };
            var epicOne = new Epic { Id = 10, Statement = "Epic 1", ProductPromiseId = 1, ProductPromise = promise, StatusColor = StatusColorRules.Todo };
            var epicTwo = new Epic { Id = 11, Statement = "Epic 2", ProductPromiseId = 1, ProductPromise = promise, StatusColor = StatusColorRules.Done };
            var journeyOne = new Journey { Id = 20, Statement = "Journey 1", EpicId = 10, Epic = epicOne, StatusColor = StatusColorRules.Todo };
            var journeyTwo = new Journey { Id = 21, Statement = "Journey 2", EpicId = 11, Epic = epicTwo, StatusColor = StatusColorRules.Done };
            var flowOne = new Flow { Id = 30, Statement = "Flow 1", JourneyId = 20, Journey = journeyOne, StatusColor = StatusColorRules.Todo };
            var flowTwo = new Flow { Id = 31, Statement = "Flow 2", JourneyId = 20, Journey = journeyOne, StatusColor = StatusColorRules.Done };
            var flowThree = new Flow { Id = 32, Statement = "Flow 3", JourneyId = 21, Journey = journeyTwo, StatusColor = StatusColorRules.Done };

            _context.Projects.Add(project);
            _context.Promises.Add(promise);
            _context.Epics.AddRange(epicOne, epicTwo);
            _context.Journeys.AddRange(journeyOne, journeyTwo);
            _context.Flows.AddRange(flowOne, flowTwo, flowThree);
            _context.Moments.AddRange(
                new Moment { Id = 100, Statement = "Blocked 1", FlowId = 30, Flow = flowOne, Status = PromiseModelOnline.Api.Enums.MomentStatus.Blocked, StatusColor = StatusColorRules.Blocked },
                new Moment { Id = 101, Statement = "Blocked 2", FlowId = 30, Flow = flowOne, Status = PromiseModelOnline.Api.Enums.MomentStatus.Blocked, StatusColor = StatusColorRules.Blocked },
                new Moment { Id = 102, Statement = "Done 1", FlowId = 31, Flow = flowTwo, Status = PromiseModelOnline.Api.Enums.MomentStatus.Done, StatusColor = StatusColorRules.Done, CompletedAt = DateTime.UtcNow },
                new Moment { Id = 103, Statement = "Done 2", FlowId = 31, Flow = flowTwo, Status = PromiseModelOnline.Api.Enums.MomentStatus.Done, StatusColor = StatusColorRules.Done, CompletedAt = DateTime.UtcNow },
                new Moment { Id = 104, Statement = "Done 3", FlowId = 32, Flow = flowThree, Status = PromiseModelOnline.Api.Enums.MomentStatus.Done, StatusColor = StatusColorRules.Done, CompletedAt = DateTime.UtcNow },
                new Moment { Id = 105, Statement = "Done 4", FlowId = 32, Flow = flowThree, Status = PromiseModelOnline.Api.Enums.MomentStatus.Done, StatusColor = StatusColorRules.Done, CompletedAt = DateTime.UtcNow }
            );
            await _context.SaveChangesAsync();

            await _service.RecalculateFromFlowAsync(30);

            var updatedFlowOne = await _context.Flows.FindAsync(30);
            var updatedFlowTwo = await _context.Flows.FindAsync(31);
            var updatedFlowThree = await _context.Flows.FindAsync(32);
            var updatedJourneyOne = await _context.Journeys.FindAsync(20);
            var updatedJourneyTwo = await _context.Journeys.FindAsync(21);
            var updatedEpicOne = await _context.Epics.FindAsync(10);
            var updatedEpicTwo = await _context.Epics.FindAsync(11);
            var updatedPromise = await _context.Promises.FindAsync(1);

            Assert.That(updatedFlowOne!.StatusColor, Is.EqualTo(StatusColorRules.Blocked));
            Assert.That(updatedFlowTwo!.StatusColor, Is.EqualTo(StatusColorRules.Done));
            Assert.That(updatedFlowThree!.StatusColor, Is.EqualTo(StatusColorRules.Done));
            Assert.That(updatedJourneyOne!.StatusColor, Is.EqualTo(StatusColorRules.InProgress));
            Assert.That(updatedJourneyTwo!.StatusColor, Is.EqualTo(StatusColorRules.Done));
            Assert.That(updatedEpicOne!.StatusColor, Is.EqualTo(StatusColorRules.InProgress));
            Assert.That(updatedEpicTwo!.StatusColor, Is.EqualTo(StatusColorRules.Done));
            Assert.That(updatedPromise!.StatusColor, Is.EqualTo(StatusColorRules.InProgress));
        }

        [Test]
        public void RecalculateFromFlowAsync_InvalidFlowId_ThrowsKeyNotFound()
        {
            Assert.ThrowsAsync<KeyNotFoundException>(() => _service.RecalculateFromFlowAsync(999));
        }

        [Test]
        public async Task RecalculateFromFlowAsync_AllBlockedChildren_RollsUpBlocked()
        {
            var project = new Project { Id = 2, Name = "Project 2" };
            var promise = new Promise { Id = 2, Statement = "Promise 2", ProjectId = 2, Project = project, StatusColor = StatusColorRules.Done };
            var epic = new Epic { Id = 20, Statement = "Epic", ProductPromiseId = 2, ProductPromise = promise, StatusColor = StatusColorRules.Done };
            var journey = new Journey { Id = 30, Statement = "Journey", EpicId = 20, Epic = epic, StatusColor = StatusColorRules.Done };
            var flow = new Flow { Id = 40, Statement = "Flow", JourneyId = 30, Journey = journey, StatusColor = StatusColorRules.Done };

            _context.Projects.Add(project);
            _context.Promises.Add(promise);
            _context.Epics.Add(epic);
            _context.Journeys.Add(journey);
            _context.Flows.Add(flow);
            _context.Moments.AddRange(
                new Moment { Id = 200, Statement = "Blocked A", FlowId = 40, Flow = flow, Status = PromiseModelOnline.Api.Enums.MomentStatus.Blocked, StatusColor = StatusColorRules.Blocked },
                new Moment { Id = 201, Statement = "Blocked B", FlowId = 40, Flow = flow, Status = PromiseModelOnline.Api.Enums.MomentStatus.Blocked, StatusColor = StatusColorRules.Blocked }
            );
            await _context.SaveChangesAsync();

            await _service.RecalculateFromFlowAsync(40);

            var updatedFlow = await _context.Flows.FindAsync(40);
            Assert.That(updatedFlow!.StatusColor, Is.EqualTo(StatusColorRules.Blocked));
        }
    }
}