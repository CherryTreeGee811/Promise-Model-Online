using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PMO.Core.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class FlowRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private FlowRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new FlowRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetFlowsByJourneyAsync_ReturnsMatchingFlows()
        {
            var flows = new List<Flow>
            {
                new Flow { Id = 1, Statement = "Login", JourneyId = 10 },
                new Flow { Id = 2, Statement = "Register", JourneyId = 20 },
                new Flow { Id = 3, Statement = "Logout", JourneyId = 10 }
            };
            _context.Flows.AddRange(flows);
            await _context.SaveChangesAsync();

            var result = await _repo.GetFlowsByJourneyAsync(10);
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(f => f.JourneyId == 10), Is.True);
            Assert.That(list.Select(f => f.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task GetFlowsByJourneyAsync_NoMatch_ReturnsEmpty()
        {
            _context.Flows.Add(new Flow { Id = 1, JourneyId = 99 });
            await _context.SaveChangesAsync();

            var result = await _repo.GetFlowsByJourneyAsync(100);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetFlowsByJourneyAsync_EmptyDatabase_ReturnsEmpty()
        {
            var result = await _repo.GetFlowsByJourneyAsync(1);
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var flow = new Flow { Id = 5, Statement = "Test Flow", JourneyId = 1 };
            _context.Flows.Add(flow);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(5);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var flow = new Flow { Statement = "New Flow", JourneyId = 2 };
            await _repo.AddAsync(flow);
            await _context.SaveChangesAsync();
            
            var saved = _context.Flows.FirstOrDefault(f => f.Statement == "New Flow");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.JourneyId, Is.EqualTo(2));
        }

        [Test]
        public async Task DeleteByIdAsync_WithChildMoment_DeletesFlowAndDescendants()
        {
            var flow = new Flow { Id = 1, Statement = "Parent Flow", JourneyId = 10 };
            var moment = new Moment { Id = 2, Statement = "Child Moment", FlowId = 1, Flow = flow };
            var flowComment = new Comment { Id = 3, UserId = 1, Text = "Flow comment", FlowId = 1 };
            var momentComment = new Comment { Id = 4, UserId = 1, Text = "Moment comment", MomentId = 2 };
            var momentTask = new MomentTask { Id = 5, Description = "Task", MomentId = 2 };

            _context.Flows.Add(flow);
            _context.Moments.Add(moment);
            _context.Set<Comment>().AddRange(flowComment, momentComment);
            _context.Set<MomentTask>().Add(momentTask);
            await _context.SaveChangesAsync();

            var deleted = await _repo.DeleteByIdAsync(1);

            Assert.That(deleted, Is.True);
            Assert.That(_context.Flows.Any(), Is.False);
            Assert.That(_context.Moments.Any(), Is.False);
            Assert.That(_context.Set<Comment>().Any(), Is.False);
            Assert.That(_context.Set<MomentTask>().Any(), Is.False);
        }
    }
}