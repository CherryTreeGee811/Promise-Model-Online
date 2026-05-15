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
    public class JourneyServiceUnitTests
    {
        private Mock<IJourneyRepository> _journeyRepoMock = null!;
        private JourneyService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _journeyRepoMock = new Mock<IJourneyRepository>();
            _service = new JourneyService(_journeyRepoMock.Object);
        }

        #region GetJourneysByEpicAsync Tests

        [Test]
        public async Task GetJourneysByEpicAsync_ReturnsMatchingJourneys()
        {
            // Arrange
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Onboarding Journey", EpicId = 10 },
                new Journey { Id = 2, Statement = "Settings Journey", EpicId = 10 }
            };

            _journeyRepoMock.Setup(r => r.GetJourneysByEpicAsync(10)).ReturnsAsync(journeys);

            // Act
            var result = await _service.GetJourneysByEpicAsync(10);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(j => j.EpicId == 10), Is.True);
            _journeyRepoMock.Verify(r => r.GetJourneysByEpicAsync(10), Times.Once);
        }

        [Test]
        public async Task GetJourneysByEpicAsync_NoJourneys_ReturnsEmpty()
        {
            _journeyRepoMock.Setup(r => r.GetJourneysByEpicAsync(99)).ReturnsAsync(new List<Journey>());

            var result = await _service.GetJourneysByEpicAsync(99);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region Inherited generic methods

        [Test]
        public async Task GetAllAsync_DelegatesToRepository()
        {
            var journeys = new List<Journey>
            {
                new Journey { Id = 1 },
                new Journey { Id = 2 }
            };
            _journeyRepoMock.As<IGenericRepository<Journey>>().Setup(r => r.GetAllAsync()).ReturnsAsync(journeys);

            var result = await _service.GetAllAsync();

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsJourney_WhenFound()
        {
            var journey = new Journey { Id = 5, Statement = "Test Journey" };
            _journeyRepoMock.As<IGenericRepository<Journey>>().Setup(r => r.GetByIdAsync(5)).ReturnsAsync(journey);

            var result = await _service.GetByIdAsync(5);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(5));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
        {
            _journeyRepoMock.As<IGenericRepository<Journey>>().Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Journey?)null);

            var result = await _service.GetByIdAsync(404);

            Assert.That(result, Is.Null);
        }

        #endregion
    }
}