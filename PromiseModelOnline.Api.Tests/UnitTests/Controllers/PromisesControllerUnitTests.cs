using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class PromisesControllerUnitTests
    {
        private Mock<IGenericService<Promise>> _mockService = null!;
        private Mock<IGenericMapper<Promise, PromiseDTO>> _mockMapper = null!;
        private Mock<IMomentService> _mockMomentService = null!;
        private Mock<IPromiseModelOnlineContext> _mockContext = null!;
        private PromisesController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockService = new Mock<IGenericService<Promise>>();
            _mockMapper = new Mock<IGenericMapper<Promise, PromiseDTO>>();
            _mockMomentService = new Mock<IMomentService>();
            _mockContext = new Mock<IPromiseModelOnlineContext>();
            _controller = new PromisesController(_mockService.Object, _mockMapper.Object, _mockMomentService.Object, _mockContext.Object);
        }

        [Test]
        public async Task GetTotalEffort_ReturnsOkWithServiceResult()
        {
            _mockMomentService.Setup(s => s.GetTotalEffortForPromiseAsync(42)).ReturnsAsync(128);

            var result = await _controller.GetTotalEffort(42);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            Assert.That(ok!.Value, Is.EqualTo(128));
            _mockMomentService.Verify(s => s.GetTotalEffortForPromiseAsync(42), Times.Once);
        }
    }
}