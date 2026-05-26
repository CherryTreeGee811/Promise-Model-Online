using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class StridesControllerUnitTests
    {
        private Mock<IStrideService> _mockStrideService = null!;
        private Mock<IGenericMapper<Stride, StrideDTO>> _mockMapper = null!;
        private Mock<IMomentService> _mockMomentService = null!;
        private StridesController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockStrideService = new Mock<IStrideService>();
            _mockMapper = new Mock<IGenericMapper<Stride, StrideDTO>>();
            _mockMomentService = new Mock<IMomentService>();
            _controller = new StridesController(
                _mockStrideService.Object,
                _mockMapper.Object,
                _mockMomentService.Object,
                NullLogger<StridesController>.Instance);
            _controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        }

        [Test]
        public async Task GetAll_WithoutQuery_ReturnsAllStrides()
        {
            var strides = new List<Stride>
            {
                new Stride { Id = 1, Name = "Stride 1", IterationId = 10 },
                new Stride { Id = 2, Name = "Stride 2", IterationId = 11 }
            };

            _mockStrideService.Setup(s => s.GetAllAsync()).ReturnsAsync(strides);
            _mockMapper.Setup(m => m.Map(It.IsAny<Stride>(), It.IsAny<IGenericService<Stride>>()))
                .Returns<Stride, IGenericService<Stride>>((stride, service) => new StrideDTO
                {
                    Id = stride.Id,
                    Name = stride.Name,
                    IterationId = stride.IterationId,
                    StartDate = stride.StartDate,
                    EndDate = stride.EndDate,
                    DurationDays = stride.DurationDays,
                    IsActive = stride.IsActive,
                    CreatedAt = stride.CreatedAt
                });

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { Request = { QueryString = QueryString.Empty } }
            };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dtos = ok!.Value as List<StrideDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].Name, Is.EqualTo("Stride 1"));
            _mockStrideService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithValidIterationId_ReturnsFilteredStrides()
        {
            const int iterationId = 8;
            var strides = new List<Stride>
            {
                new Stride { Id = 3, Name = "Filtered", IterationId = iterationId }
            };

            _mockStrideService.Setup(s => s.GetStridesByIterationAsync(iterationId)).ReturnsAsync(strides);
            _mockMapper.Setup(m => m.Map(It.IsAny<Stride>(), It.IsAny<IGenericService<Stride>>()))
                .Returns<Stride, IGenericService<Stride>>((stride, service) => new StrideDTO
                {
                    Id = stride.Id,
                    Name = stride.Name,
                    IterationId = stride.IterationId
                });

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { Request = { QueryString = new QueryString($"?iterationId={iterationId}") } }
            };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dtos = ok!.Value as List<StrideDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            Assert.That(dtos[0].IterationId, Is.EqualTo(iterationId));
            _mockStrideService.Verify(s => s.GetStridesByIterationAsync(iterationId), Times.Once);
            _mockStrideService.Verify(s => s.GetAllAsync(), Times.Never);
        }

        [Test]
        public async Task GetAll_WithInvalidIterationId_FallsBackToAllStrides()
        {
            var strides = new List<Stride>
            {
                new Stride { Id = 4, Name = "All strides" }
            };

            _mockStrideService.Setup(s => s.GetAllAsync()).ReturnsAsync(strides);
            _mockMapper.Setup(m => m.Map(It.IsAny<Stride>(), It.IsAny<IGenericService<Stride>>()))
                .Returns<Stride, IGenericService<Stride>>((stride, service) => new StrideDTO
                {
                    Id = stride.Id,
                    Name = stride.Name
                });

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { Request = { QueryString = new QueryString("?iterationId=not-an-int") } }
            };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dtos = ok!.Value as List<StrideDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            Assert.That(dtos[0].Name, Is.EqualTo("All strides"));
            _mockStrideService.Verify(s => s.GetStridesByIterationAsync(It.IsAny<int>()), Times.Never);
            _mockStrideService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task UpdateStride_ProgressUnfinishedMoments_ReturnsNoContentAndMovesMoments()
        {
            const int strideId = 12;

            _mockMomentService
                .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
                .Returns(Task.CompletedTask);

            var result = await _controller.UpdateStride(strideId, new UpdateStrideRequestDTO { ProgressUnfinishedMoments = true });

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockMomentService.Verify(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId), Times.Once);
        }

    }
}