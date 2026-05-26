using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class IterationsControllerUnitTests
    {
        private Mock<IIterationService> _mockIterationService = null!;
        private Mock<IGenericMapper<Iteration, IterationDTO>> _mockMapper = null!;
        private Mock<IMomentService> _momentServiceMock = null!;
        private IterationsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockIterationService = new Mock<IIterationService>();
            _mockMapper = new Mock<IGenericMapper<Iteration, IterationDTO>>();
            _momentServiceMock = new Mock<IMomentService>();

            _controller = new IterationsController(
                _mockIterationService.Object,
                _mockMapper.Object,
                _momentServiceMock.Object
            );
            _controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        }

        [Test]
        public async Task GetAll_WithValidProjectId_ReturnsIterationsForProject()
        {
            var projectId = 42;
            var iterations = new List<Iteration>
            {
                new Iteration { Id = 1, Name = "Iteration 1", ProjectId = projectId, CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new Iteration { Id = 2, Name = "Iteration 2", ProjectId = projectId, CreatedAt = DateTime.UtcNow.AddDays(-1) }
            };

            _mockIterationService.Setup(s => s.GetIterationsByProjectAsync(projectId)).ReturnsAsync(iterations);
            _mockMapper.Setup(m => m.Map(It.IsAny<Iteration>(), It.IsAny<IGenericService<Iteration>>()))
                .Returns<Iteration, IGenericService<Iteration>>((iteration, service) => new IterationDTO
                {
                    Id = iteration.Id,
                    Name = iteration.Name,
                    ProjectId = iteration.ProjectId,
                    CreatedAt = iteration.CreatedAt
                });

            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?projectId={projectId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var dtos = okResult?.Value as List<IterationDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].Id, Is.EqualTo(1));
            Assert.That(dtos[0].ProjectId, Is.EqualTo(projectId));
            _mockIterationService.Verify(s => s.GetIterationsByProjectAsync(projectId), Times.Once);
            _mockIterationService.Verify(s => s.GetAllAsync(), Times.Never);
        }

        [Test]
        public async Task GetAll_WithInvalidProjectId_ReturnsAllIterations()
        {
            var iterations = new List<Iteration>
            {
                new Iteration { Id = 10, Name = "Iteration A", ProjectId = 1, CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new Iteration { Id = 11, Name = "Iteration B", ProjectId = 2, CreatedAt = DateTime.UtcNow.AddDays(-1) }
            };

            _mockIterationService.Setup(s => s.GetAllAsync()).ReturnsAsync(iterations);
            _mockMapper.Setup(m => m.Map(It.IsAny<Iteration>(), It.IsAny<IGenericService<Iteration>>()))
                .Returns<Iteration, IGenericService<Iteration>>((iteration, service) => new IterationDTO
                {
                    Id = iteration.Id,
                    Name = iteration.Name,
                    ProjectId = iteration.ProjectId,
                    CreatedAt = iteration.CreatedAt
                });

            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?projectId=not-a-number");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var dtos = okResult?.Value as List<IterationDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].Id, Is.EqualTo(10));
            _mockIterationService.Verify(s => s.GetAllAsync(), Times.Once);
            _mockIterationService.Verify(s => s.GetIterationsByProjectAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetAll_WithoutProjectId_ReturnsAllIterations()
        {
            var iterations = new List<Iteration>
            {
                new Iteration { Id = 20, Name = "Iteration X", ProjectId = 3, CreatedAt = DateTime.UtcNow.AddDays(-4) }
            };

            _mockIterationService.Setup(s => s.GetAllAsync()).ReturnsAsync(iterations);
            _mockMapper.Setup(m => m.Map(It.IsAny<Iteration>(), It.IsAny<IGenericService<Iteration>>()))
                .Returns<Iteration, IGenericService<Iteration>>((iteration, service) => new IterationDTO
                {
                    Id = iteration.Id,
                    Name = iteration.Name,
                    ProjectId = iteration.ProjectId,
                    CreatedAt = iteration.CreatedAt
                });

            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = QueryString.Empty;
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var dtos = okResult?.Value as List<IterationDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            Assert.That(dtos[0].Id, Is.EqualTo(20));
            _mockIterationService.Verify(s => s.GetAllAsync(), Times.Once);
            _mockIterationService.Verify(s => s.GetIterationsByProjectAsync(It.IsAny<int>()), Times.Never);
        }
    }
}