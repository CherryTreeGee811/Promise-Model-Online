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
            _iterationServiceMock = new Mock<IIterationService>();
            _strideServiceMock = new Mock<IStrideService>();
            _hierarchyStatusServiceMock = new Mock<IHierarchyStatusService>();

            _service = new MomentService(
                _momentRepoMock.Object,
                _strideRepoMock.Object,
                _iterationRepoMock.Object,
                _iterationServiceMock.Object,
                _strideServiceMock.Object,
                _hierarchyStatusServiceMock.Object);
        }

        #region GetIterationBurndownAsync Tests

        [Test]
        public async Task GetIterationBurndownAsync_NoMoments_ReturnsEmptyList()
        {
            // Arrange
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(It.IsAny<int>(), false))
                           .ReturnsAsync(new List<Moment>());
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(It.IsAny<int>(), true))
                           .ReturnsAsync(new List<Moment>());

            // Act
            var result = await _service.GetIterationBurndownAsync(1);

            // Assert
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task GetIterationBurndownAsync_AllMomentsHaveNoEstimates_RemainingEffortZero()
        {
            // Arrange
            var moments = new List<Moment>
            {
                new Moment { Id = 1, CreatedAt = DateTime.UtcNow.AddDays(-10), EffortEstimate = null },
                new Moment { Id = 2, CreatedAt = DateTime.UtcNow.AddDays(-10), EffortEstimate = null }
            };

            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, false)).ReturnsAsync(moments);
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, true)).ReturnsAsync(new List<Moment>());

            // Act
            var result = await _service.GetIterationBurndownAsync(1);

            // Assert
            Assert.That(result, Is.Not.Empty);
            foreach (var point in result)
            {
                Assert.That(point.RemainingEffort, Is.EqualTo(0));
            }
        }

        [Test]
        public async Task GetIterationBurndownAsync_WithEstimatesAndNoCompletions_ConstantRemainingEffort()
        {
            // Arrange
            var moments = new List<Moment>
            {
                new Moment { Id = 1, CreatedAt = DateTime.UtcNow.AddDays(-10), EffortEstimate = Estimate.M },
                new Moment { Id = 2, CreatedAt = DateTime.UtcNow.AddDays(-10), EffortEstimate = Estimate.S }
            };
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, false)).ReturnsAsync(moments);
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, true)).ReturnsAsync(new List<Moment>());

            // Act
            var result = await _service.GetIterationBurndownAsync(1);

            // Assert
            Assert.That(result, Is.Not.Empty);
            var totalEffort = 3 + 2; // M=3, S=2
            foreach (var point in result)
            {
                Assert.That(point.RemainingEffort, Is.EqualTo(totalEffort));
            }
        }

        [Test]
        public async Task GetIterationBurndownAsync_WithCompletedMoments_RemainingEffortDecreases()
        {
            // Arrange
            var moments = new List<Moment>
            {
                new Moment { Id = 1, CreatedAt = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc), EffortEstimate = Estimate.M, CompletedAt = new DateTime(2026, 6, 3, 12, 0, 0, DateTimeKind.Utc) },
                new Moment { Id = 2, CreatedAt = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc), EffortEstimate = Estimate.S, CompletedAt = null }
            };
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, false)).ReturnsAsync(moments);
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, true)).ReturnsAsync(new List<Moment>());

            // Act
            var result = await _service.GetIterationBurndownAsync(1);

            // Assert
            Assert.That(result, Is.Not.Empty);
            var totalEffort = 3 + 2; // 5
            // Before completion date, remaining effort = 5; after, remaining = 2
            var beforeComplete = result.Where(p => p.Date < new DateTime(2026, 6, 3)).ToList();
            var afterComplete = result.Where(p => p.Date >= new DateTime(2026, 6, 3)).ToList();

            Assert.That(beforeComplete.All(p => p.RemainingEffort == totalEffort), Is.True);
            Assert.That(afterComplete.All(p => p.RemainingEffort == 2), Is.True);
        }

        [Test]
        public async Task GetIterationBurndownAsync_IdealLineStartsAtTotalEffortAndEndsAtZero()
        {
            var moment = new Moment { Id = 1, CreatedAt = DateTime.UtcNow.AddDays(-10), EffortEstimate = Estimate.XL };
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, false)).ReturnsAsync(new List<Moment> { moment });
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, true)).ReturnsAsync(new List<Moment>());

            // Act
            var result = await _service.GetIterationBurndownAsync(1);

            // Assert
            Assert.That(result, Is.Not.Empty);
            Assert.That(result.First().IdealRemaining, Is.EqualTo(8)); // XL = 8
            Assert.That(result.Last().IdealRemaining, Is.EqualTo(0));
        }

        [Test]
        public async Task GetIterationBurndownAsync_DeduplicatesMomentsAcrossAssignedAndUnassigned()
        {
            // Arrange: same moment appears in both assigned and unassigned (should not happen but defensive)
            var moment = new Moment { Id = 1, CreatedAt = DateTime.UtcNow, EffortEstimate = Estimate.M };
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, false)).ReturnsAsync(new List<Moment> { moment });
            _momentRepoMock.Setup(r => r.GetMomentsByIterationAsync(1, true)).ReturnsAsync(new List<Moment> { moment });

            // Act
            var result = await _service.GetIterationBurndownAsync(1);

            // Assert
            Assert.That(result, Is.Not.Empty);
            // Effort should be counted only once (3)
            Assert.That(result.First().RemainingEffort, Is.EqualTo(3));
        }

        #endregion

        #region AssignOwnerAsync Tests

        [Test]
        public async Task AssignOwnerAsync_ValidIdAndUserId_UpdatesOwner()
        {
            // Arrange
            var moment = new Moment { Id = 1, OwnerId = null };
            _momentRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(moment);
            _momentRepoMock.Setup(r => r.Update(It.IsAny<Moment>()));
            _momentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            // Act
            var result = await _service.AssignOwnerAsync(1, 42);

            // Assert
            Assert.That(result.OwnerId, Is.EqualTo(42));
            _momentRepoMock.Verify(r => r.Update(moment), Times.Once);
            _momentRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Test]
        public async Task AssignOwnerAsync_NullUserId_ClearsOwner()
        {
            // Arrange
            var moment = new Moment { Id = 2, OwnerId = 99 };
            _momentRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(moment);

            // Act
            var result = await _service.AssignOwnerAsync(2, null);

            // Assert
            Assert.That(result.OwnerId, Is.Null);
        }

        [Test]
        public void AssignOwnerAsync_InvalidId_ThrowsKeyNotFound()
        {
            // Arrange
            _momentRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Moment?)null);

            // Act + Assert
            Assert.ThrowsAsync<KeyNotFoundException>(() => _service.AssignOwnerAsync(999, 1));
        }

        #endregion

        #region UpdateMomentEstimateAsync Tests

        [Test]
        public async Task UpdateMomentEstimateAsync_UpdatesEstimateAndTimestamp()
        {
            // Arrange
            var moment = new Moment { Id = 3, EffortEstimate = null, UpdatedAt = null };
            _momentRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(moment);

            // Act
            var result = await _service.UpdateMomentEstimateAsync(3, Estimate.L);

            // Assert
            Assert.That(result.EffortEstimate, Is.EqualTo(Estimate.L));
            Assert.That(result.UpdatedAt, Is.Not.Null);
        }

        [Test]
        public async Task UpdateMomentStatusAsync_UpdatesStatusColorAndRollsUpHierarchy()
        {
            var moment = new Moment { Id = 4, FlowId = 77, Status = MomentStatus.Todo, StatusColor = StatusColorRules.Todo };
            _momentRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(moment);
            _momentRepoMock.Setup(r => r.Update(It.IsAny<Moment>()));
            _momentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _hierarchyStatusServiceMock.Setup(r => r.RecalculateFromFlowAsync(77)).Returns(Task.CompletedTask);

            var result = await _service.UpdateMomentStatusAsync(4, MomentStatus.Blocked);

            Assert.That(result.StatusColor, Is.EqualTo(StatusColorRules.Blocked));
            Assert.That(result.CompletedAt, Is.Null);
            _hierarchyStatusServiceMock.Verify(r => r.RecalculateFromFlowAsync(77), Times.Once);
        }

        [Test]
        public async Task UpdateMomentStatusAsync_DoneSetsCompletionAndDoneColor()
        {
            var moment = new Moment { Id = 5, FlowId = 78, Status = MomentStatus.Todo, StatusColor = StatusColorRules.Todo };
            _momentRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(moment);
            _momentRepoMock.Setup(r => r.Update(It.IsAny<Moment>()));
            _momentRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
            _hierarchyStatusServiceMock.Setup(r => r.RecalculateFromFlowAsync(78)).Returns(Task.CompletedTask);

            var result = await _service.UpdateMomentStatusAsync(5, MomentStatus.Done);

            Assert.That(result.StatusColor, Is.EqualTo(StatusColorRules.Done));
            Assert.That(result.CompletedAt, Is.Not.Null);
        }

        [Test]
        public void UpdateMomentStatusAsync_InvalidId_ThrowsKeyNotFound()
        {
            _momentRepoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Moment?)null);

            Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateMomentStatusAsync(404, MomentStatus.Blocked));
        }

        [Test]
        public void UpdateMomentEstimateAsync_InvalidId_ThrowsKeyNotFound()
        {
            _momentRepoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Moment?)null);
            Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateMomentEstimateAsync(404, Estimate.XS));
        }

        #endregion

        #region MoveUnfinishedMomentsToNextStrideAsync Tests

        [Test]
        public async Task MoveUnfinishedMoments_NoUnfinishedMoments_DoesNothing()
        {
            // Arrange
            _momentRepoMock.Setup(r => r.GetUnfinishedMomentsByStrideAsync(1)).ReturnsAsync(new List<Moment>());

            // Act
            await _service.MoveUnfinishedMomentsToNextStrideAsync(1);

            // Assert
            _momentRepoMock.Verify(r => r.Update(It.IsAny<Moment>()), Times.Never);
        }

        [Test]
        public async Task MoveUnfinishedMoments_CurrentStrideNotFound_ReturnsEarly()
        {
            // Arrange
            var moments = new List<Moment> { new Moment { Id = 1 } };
            _momentRepoMock.Setup(r => r.GetUnfinishedMomentsByStrideAsync(1)).ReturnsAsync(moments);
            _strideRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Stride?)null);

            // Act
            await _service.MoveUnfinishedMomentsToNextStrideAsync(1);

            // Assert: no updates
            _momentRepoMock.Verify(r => r.Update(It.IsAny<Moment>()), Times.Never);
        }

        [Test]
        public async Task MoveUnfinishedMoments_CurrentStrideHasNoIteration_ReturnsEarly()
        {
            // Arrange
            var moments = new List<Moment> { new Moment { Id = 1 } };
            _momentRepoMock.Setup(r => r.GetUnfinishedMomentsByStrideAsync(1)).ReturnsAsync(moments);
            _strideRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(new Stride { Id = 1, IterationId = null });

            // Act
            await _service.MoveUnfinishedMomentsToNextStrideAsync(1);

            // Assert
            _momentRepoMock.Verify(r => r.Update(It.IsAny<Moment>()), Times.Never);
        }

        [Test]
        public async Task MoveUnfinishedMoments_MovesToNextStrideInSameIteration()
        {
            // Arrange
            var moment = new Moment { Id = 10, AssignedStrideId = 1 };
            var moments = new List<Moment> { moment };
            var stride1 = new Stride { Id = 1, IterationId = 5, StartDate = new DateTime(2026, 1, 1) };
            var stride2 = new Stride { Id = 2, IterationId = 5, StartDate = new DateTime(2026, 1, 15) };

            _momentRepoMock.Setup(r => r.GetUnfinishedMomentsByStrideAsync(1)).ReturnsAsync(moments);
            _strideRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(stride1);
            _strideServiceMock.Setup(s => s.GetStridesByIterationAsync(5))
                              .ReturnsAsync(new List<Stride> { stride1, stride2 });

            // Act
            await _service.MoveUnfinishedMomentsToNextStrideAsync(1);

            // Assert
            _momentRepoMock.Verify(r => r.Update(moment), Times.Once);
            _momentRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
            Assert.That(moment.AssignedStrideId, Is.EqualTo(2));
            Assert.That(moment.IsZombie, Is.True);
            Assert.That(moment.OriginalStrideId, Is.EqualTo(1));
        }

        [Test]
        public async Task MoveUnfinishedMoments_NoNextStrideInIteration_MovesToFirstStrideOfNextIteration()
        {
            // Arrange
            var moment = new Moment { Id = 10, AssignedStrideId = 3 };
            var moments = new List<Moment> { moment };
            var stride3 = new Stride { Id = 3, IterationId = 1, StartDate = new DateTime(2026, 2, 1) };
            var iteration1 = new Iteration { Id = 1, ProjectId = 100 };
            var iteration2 = new Iteration { Id = 2, ProjectId = 100 };
            var stride4 = new Stride { Id = 4, IterationId = 2, StartDate = new DateTime(2026, 3, 1) };

            _momentRepoMock.Setup(r => r.GetUnfinishedMomentsByStrideAsync(3)).ReturnsAsync(moments);
            _strideRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(stride3);
            // Only stride3 in iteration1
            _strideServiceMock.Setup(s => s.GetStridesByIterationAsync(1)).ReturnsAsync(new List<Stride> { stride3 });
            _iterationRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(iteration1);
            _iterationServiceMock.Setup(s => s.GetIterationsByProjectAsync(100))
                                 .ReturnsAsync(new List<Iteration> { iteration1, iteration2 });
            _strideServiceMock.Setup(s => s.GetStridesByIterationAsync(2)).ReturnsAsync(new List<Stride> { stride4 });

            // Act
            await _service.MoveUnfinishedMomentsToNextStrideAsync(3);

            // Assert
            Assert.That(moment.AssignedStrideId, Is.EqualTo(4));
            Assert.That(moment.IsZombie, Is.True);
            Assert.That(moment.OriginalStrideId, Is.EqualTo(3));
        }

        #endregion
    }
}