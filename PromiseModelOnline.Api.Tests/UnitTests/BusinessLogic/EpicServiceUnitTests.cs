using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class EpicServiceUnitTests
    {
        private Mock<IEpicRepository> _epicRepoMock = null!;
        private Mock<IHierarchyStatusService> _hierarchyStatusServiceMock = null!;
        private EpicService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _epicRepoMock = new Mock<IEpicRepository>();
            _hierarchyStatusServiceMock = new Mock<IHierarchyStatusService>();
            _service = new EpicService(_epicRepoMock.Object, _hierarchyStatusServiceMock.Object);
        }

        #region GetEpicsByPromiseAsync Tests

        [Test]
        public async Task GetEpicsByPromiseAsync_ReturnsMatchingEpics()
        {
            // Arrange
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "User Management", ProductPromiseId = 10 },
                new Epic { Id = 2, Statement = "Reporting", ProductPromiseId = 10 }
            };

            _epicRepoMock.Setup(r => r.GetEpicsByPromiseAsync(10)).ReturnsAsync(epics);

            // Act
            var result = await _service.GetEpicsByPromiseAsync(10);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(e => e.ProductPromiseId == 10), Is.True);
            _epicRepoMock.Verify(r => r.GetEpicsByPromiseAsync(10), Times.Once);
        }

        [Test]
        public async Task GetEpicsByPromiseAsync_NoEpics_ReturnsEmpty()
        {
            // Arrange
            _epicRepoMock.Setup(r => r.GetEpicsByPromiseAsync(99)).ReturnsAsync(new List<Epic>());

            // Act
            var result = await _service.GetEpicsByPromiseAsync(99);

            // Assert
            Assert.That(result, Is.Empty);
        }

        #endregion

        #region Inherited Methods (optional – shows base functionality works)

        [Test]
        public async Task GetAllAsync_ReturnsAllEpics()
        {
            // Arrange
            var epics = new List<Epic>
            {
                new Epic { Id = 1 },
                new Epic { Id = 2 }
            };
            _epicRepoMock.As<IGenericRepository<Epic>>().Setup(r => r.GetAllAsync()).ReturnsAsync(epics);

            // Act
            var result = await _service.GetAllAsync();

            // Assert
            Assert.That(result.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task GetByIdAsync_ValidId_ReturnsEpic()
        {
            var epic = new Epic { Id = 5, Statement = "Test" };
            _epicRepoMock.As<IGenericRepository<Epic>>().Setup(r => r.GetByIdAsync(5)).ReturnsAsync(epic);

            var result = await _service.GetByIdAsync(5);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task GetByIdAsync_InvalidId_ReturnsNull()
        {
            _epicRepoMock.As<IGenericRepository<Epic>>().Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Epic?)null);

            var result = await _service.GetByIdAsync(404);

            Assert.That(result, Is.Null);
        }

        [Test]
        public async Task AddAsync_RollsUpHierarchyFromPromise()
        {
            var epic = new Epic { Id = 9, ProductPromiseId = 23 };

            await _service.AddAsync(epic);

            _hierarchyStatusServiceMock.Verify(s => s.RecalculateFromEpicAsync(9), Times.Once);
        }

        [Test]
        public async Task DeleteByIdAsync_RollsUpHierarchyFromPromise()
        {
            var epic = new Epic { Id = 9, ProductPromiseId = 23 };
            _epicRepoMock.As<IGenericRepository<Epic>>().Setup(r => r.GetByIdAsync(9)).ReturnsAsync(epic);
            _epicRepoMock.As<IGenericRepository<Epic>>().Setup(r => r.DeleteByIdAsync(9)).ReturnsAsync(true);

            var deleted = await _service.DeleteByIdAsync(9);

            Assert.That(deleted, Is.True);
            _hierarchyStatusServiceMock.Verify(s => s.RecalculateFromPromiseAsync(23), Times.Once);
        }

        #endregion
    }
}