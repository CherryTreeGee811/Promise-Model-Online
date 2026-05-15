using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class IterationServiceUnitTests
    {
        private Mock<IIterationRepository> _iterationRepoMock = null!;
        private IterationService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _iterationRepoMock = new Mock<IIterationRepository>();
            _service = new IterationService(_iterationRepoMock.Object);
        }

        #region GetIterationsByProjectAsync Tests

        [Test]
        public async Task GetIterationsByProjectAsync_ReturnsMatchingIterations()
        {
            // Arrange
            var iterations = new List<Iteration>
            {
                new Iteration { Id = 1, Name = "Sprint 1", ProjectId = 100 },
                new Iteration { Id = 2, Name = "Sprint 2", ProjectId = 100 }
            };

            _iterationRepoMock.Setup(r => r.GetIterationsByProjectAsync(100)).ReturnsAsync(iterations);

            // Act
            var result = await _service.GetIterationsByProjectAsync(100);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(i => i.ProjectId == 100), Is.True);
            _iterationRepoMock.Verify(r => r.GetIterationsByProjectAsync(100), Times.Once);
        }

        [Test]
        public async Task GetIterationsByProjectAsync_NoIterations_ReturnsEmpty()
        {
            _iterationRepoMock.Setup(r => r.GetIterationsByProjectAsync(999))
                              .ReturnsAsync(new List<Iteration>());

            var result = await _service.GetIterationsByProjectAsync(999);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region Inherited generic methods (optional but recommended)

        [Test]
        public async Task GetAllAsync_DelegatesToRepository()
        {
            var iterations = new List<Iteration>
            {
                new Iteration { Id = 1 },
                new Iteration { Id = 2 }
            };
            _iterationRepoMock.As<IGenericRepository<Iteration>>().Setup(r => r.GetAllAsync()).ReturnsAsync(iterations);

            var result = await _service.GetAllAsync();

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsIteration_WhenFound()
        {
            var iteration = new Iteration { Id = 3, Name = "Iteration 3" };
            _iterationRepoMock.As<IGenericRepository<Iteration>>().Setup(r => r.GetByIdAsync(3)).ReturnsAsync(iteration);

            var result = await _service.GetByIdAsync(3);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(3));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
        {
            _iterationRepoMock.As<IGenericRepository<Iteration>>().Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Iteration?)null);

            var result = await _service.GetByIdAsync(404);

            Assert.That(result, Is.Null);
        }

        #endregion
    }
}