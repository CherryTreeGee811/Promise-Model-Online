using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class MomentServiceUnitTests
    {
        private Mock<IMomentRepository> _momentRepoMock = null!;
        private Mock<IGenericRepository<Stride>> _strideRepoMock = null!;
        private Mock<IGenericRepository<Iteration>> _iterationRepoMock = null!;
        private Mock<IGenericRepository<Flow>> _flowRepoMock = null!;
        private Mock<IGenericRepository<Journey>> _journeyRepoMock = null!;
        private Mock<IGenericRepository<Epic>> _epicRepoMock = null!;
        private Mock<IGenericRepository<Promise>> _promiseRepoMock = null!;

        private Mock<IIterationService> _iterationServiceMock = null!;
        private Mock<IStrideService> _strideServiceMock = null!;
        private Mock<IHierarchyStatusService> _hierarchyStatusServiceMock = null!;

        private MomentService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _momentRepoMock = new Mock<IMomentRepository>();
            _strideRepoMock = new Mock<IGenericRepository<Stride>>();
            _iterationRepoMock = new Mock<IGenericRepository<Iteration>>();
            _flowRepoMock = new Mock<IGenericRepository<Flow>>();
            _journeyRepoMock = new Mock<IGenericRepository<Journey>>();
            _epicRepoMock = new Mock<IGenericRepository<Epic>>();
            _promiseRepoMock = new Mock<IGenericRepository<Promise>>();

            _iterationServiceMock = new Mock<IIterationService>();
            _strideServiceMock = new Mock<IStrideService>();
            _hierarchyStatusServiceMock = new Mock<IHierarchyStatusService>();

            _service = new MomentService(
                _momentRepoMock.Object,
                _strideRepoMock.Object,
                _iterationRepoMock.Object,
                _flowRepoMock.Object,
                _journeyRepoMock.Object,
                _epicRepoMock.Object,
                _promiseRepoMock.Object,
                _iterationServiceMock.Object,
                _strideServiceMock.Object,
                _hierarchyStatusServiceMock.Object
            );
        }

        // ---------------- BURNDOWN ----------------

        [Test]
        public async Task GetIterationBurndownAsync_NoMoments_ReturnsEmptyList()
        {
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(It.IsAny<int>(), false))
                           .ReturnsAsync(new List<Moment>());
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(It.IsAny<int>(), true))
                           .ReturnsAsync(new List<Moment>());

            var result = await _service.GetIterationBurndownAsync(1);

            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetIterationBurndownAsync_WithEstimates_ReturnsCorrectEffort()
        {
            var moments = new List<Moment>
            {
                new Moment { Id = 1, CreatedAt = DateTime.UtcNow.AddDays(-5), EffortEstimate = Estimate.M },
                new Moment { Id = 2, CreatedAt = DateTime.UtcNow.AddDays(-5), EffortEstimate = Estimate.S }
            };

            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, false)).ReturnsAsync(moments);
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, true)).ReturnsAsync(new List<Moment>());

            var result = await _service.GetIterationBurndownAsync(1);

            Assert.That(result, Is.Not.Empty);
            Assert.That(result.First().RemainingEffort, Is.EqualTo(5)); // M=3 + S=2
        }

        // ---------------- OWNER ----------------

        [Test]
        public async Task AssignOwnerAsync_ValidId_UpdatesOwner()
        {
            var moment = new Moment { Id = 1 };

            _momentRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(moment);
            _momentRepoMock.Setup(r => r.Update(It.IsAny<Moment>()));
            _momentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var result = await _service.AssignOwnerAsync(1, 99);

            Assert.That(result.OwnerId, Is.EqualTo(99));
            _momentRepoMock.Verify(r => r.Update(moment), Times.Once);
        }

        [Test]
        public void AssignOwnerAsync_InvalidId_Throws()
        {
            _momentRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Moment?)null);

            Assert.ThrowsAsync<KeyNotFoundException>(() => _service.AssignOwnerAsync(999, 1));
        }

        // ---------------- STATUS ----------------

        [Test]
        public async Task UpdateMomentStatusAsync_SetsDoneCorrectly()
        {
            var moment = new Moment { Id = 2, FlowId = 5 };

            _momentRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(moment);
            _momentRepoMock.Setup(r => r.Update(It.IsAny<Moment>()));
            _momentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _hierarchyStatusServiceMock.Setup(r => r.RecalculateFromFlowAsync(5)).Returns(Task.CompletedTask);

            var result = await _service.UpdateMomentStatusAsync(2, MomentStatus.Done);

            Assert.That(result.CompletedAt, Is.Not.Null);
            Assert.That(result.StatusColor, Is.EqualTo(StatusColorRules.Done));
        }

        // ---------------- ESTIMATE ----------------

        [Test]
        public async Task UpdateMomentEstimateAsync_UpdatesValue()
        {
            var moment = new Moment { Id = 3 };

            _momentRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(moment);

            var result = await _service.UpdateMomentEstimateAsync(3, Estimate.L);

            Assert.That(result.EffortEstimate, Is.EqualTo(Estimate.L));
        }

        // ---------------- MOVE STRIDE ----------------

        [Test]
        public async Task MoveUnfinishedMoments_NoMoments_DoesNothing()
        {
            _momentRepoMock.Setup(r => r.GetUnfinishedMomentsByStrideAsync(1))
                           .ReturnsAsync(new List<Moment>());

            await _service.MoveUnfinishedMomentsToNextStrideAsync(1);

            _momentRepoMock.Verify(r => r.Update(It.IsAny<Moment>()), Times.Never);
        }
    }
}