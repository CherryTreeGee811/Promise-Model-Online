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
    public class FlowServiceUnitTests
    {
        private Mock<IFlowRepository> _flowRepoMock = null!;
        private Mock<IJourneyRepository> _journeyRepoMock = null!;
        private Mock<IGenericRepository<Epic>> _epicRepoMock = null!;
        private Mock<IGenericRepository<Promise>> _promiseRepoMock = null!;

        private FlowService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _flowRepoMock = new Mock<IFlowRepository>();
            _journeyRepoMock = new Mock<IJourneyRepository>();
            _epicRepoMock = new Mock<IGenericRepository<Epic>>();
            _promiseRepoMock = new Mock<IGenericRepository<Promise>>();

            _service = new FlowService(
                _flowRepoMock.Object,
                _journeyRepoMock.Object,
                _epicRepoMock.Object,
                _promiseRepoMock.Object
            );
        }

        #region GetFlowsByJourneyAsync Tests

        [Test]
        public async Task GetFlowsByJourneyAsync_ReturnsMatchingFlows()
        {
            var flows = new List<Flow>
            {
                new Flow { Id = 1, Statement = "Login Flow", JourneyId = 5 },
                new Flow { Id = 2, Statement = "Register Flow", JourneyId = 5 }
            };

            _flowRepoMock
                .Setup(r => r.GetFlowsByJourneyAsync(5))
                .ReturnsAsync(flows);

            var result = await _service.GetFlowsByJourneyAsync(5);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(f => f.JourneyId == 5), Is.True);

            _flowRepoMock.Verify(r => r.GetFlowsByJourneyAsync(5), Times.Once);
        }

        [Test]
        public async Task GetFlowsByJourneyAsync_NoFlows_ReturnsEmpty()
        {
            _flowRepoMock
                .Setup(r => r.GetFlowsByJourneyAsync(99))
                .ReturnsAsync(new List<Flow>());

            var result = await _service.GetFlowsByJourneyAsync(99);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region Generic methods

        [Test]
        public async Task GetAllAsync_DelegatesToRepository()
        {
            var flows = new List<Flow> { new Flow { Id = 1 } };

            _flowRepoMock.As<IGenericRepository<Flow>>()
                .Setup(r => r.GetAllAsync())
                .ReturnsAsync(flows);

            var result = await _service.GetAllAsync();

            Assert.That(result.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsFlow_WhenFound()
        {
            var flow = new Flow { Id = 3, Statement = "Test" };

            _flowRepoMock.As<IGenericRepository<Flow>>()
                .Setup(r => r.GetByIdAsync(3))
                .ReturnsAsync(flow);

            var result = await _service.GetByIdAsync(3);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Id, Is.EqualTo(3));
        }

        [Test]
        public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
        {
            _flowRepoMock.As<IGenericRepository<Flow>>()
                .Setup(r => r.GetByIdAsync(404))
                .ReturnsAsync((Flow?)null);

            var result = await _service.GetByIdAsync(404);

            Assert.That(result, Is.Null);
        }

        #endregion
    }
}