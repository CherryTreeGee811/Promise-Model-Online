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
    public class EpicsControllerUnitTests
    {
        private Mock<IEpicService> _mockEpicService = null!;
        private Mock<IGenericMapper<Epic, EpicDTO>> _mockMapper = null!;
        private EpicsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockEpicService = new Mock<IEpicService>();
            _mockMapper = new Mock<IGenericMapper<Epic, EpicDTO>>();
            _controller = new EpicsController(_mockEpicService.Object, _mockMapper.Object);
        }

        #region GetAll Tests

        [Test]
        public async Task GetAll_WithoutPromiseIdParameter_ReturnsAllEpics()
        {
            // Arrange
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "Epic 1", ProductPromiseId = 10 },
                new Epic { Id = 2, Statement = "Epic 2", ProductPromiseId = 10 },
                new Epic { Id = 3, Statement = "Epic 3", ProductPromiseId = 20 }
            };

            _mockEpicService.Setup(s => s.GetAllAsync()).ReturnsAsync(epics);
            _mockMapper.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
                .Returns<Epic, IGenericService<Epic>>((e, svc) => new EpicDTO
                {
                    Id = e.Id,
                    Statement = e.Statement,
                    ProductPromiseId = e.ProductPromiseId
                });

            // Setup HttpContext with empty query string
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = QueryString.Empty;
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<EpicDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(3));
            Assert.That(dtos[0].Id, Is.EqualTo(1));
            _mockEpicService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithValidPromiseIdParameter_ReturnsEpicsFilteredByPromise()
        {
            // Arrange
            int promiseId = 10;
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "Epic 1", ProductPromiseId = 10 },
                new Epic { Id = 2, Statement = "Epic 2", ProductPromiseId = 10 }
            };

            _mockEpicService.Setup(s => s.GetEpicsByPromiseAsync(promiseId)).ReturnsAsync(epics);
            _mockMapper.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
                .Returns<Epic, IGenericService<Epic>>((e, svc) => new EpicDTO
                {
                    Id = e.Id,
                    Statement = e.Statement,
                    ProductPromiseId = e.ProductPromiseId
                });

            // Setup HttpContext with promiseId query parameter
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?promiseId={promiseId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<EpicDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].ProductPromiseId, Is.EqualTo(10));
            _mockEpicService.Verify(s => s.GetEpicsByPromiseAsync(promiseId), Times.Once);
            _mockEpicService.Verify(s => s.GetAllAsync(), Times.Never);
        }

        [Test]
        public async Task GetAll_WithInvalidPromiseIdParameter_ReturnsAllEpics()
        {
            // Arrange
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "Epic 1", ProductPromiseId = 10 },
                new Epic { Id = 2, Statement = "Epic 2", ProductPromiseId = 20 }
            };

            _mockEpicService.Setup(s => s.GetAllAsync()).ReturnsAsync(epics);
            _mockMapper.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
                .Returns<Epic, IGenericService<Epic>>((e, svc) => new EpicDTO
                {
                    Id = e.Id,
                    Statement = e.Statement,
                    ProductPromiseId = e.ProductPromiseId
                });

            // Setup HttpContext with invalid promiseId (non-integer)
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?promiseId=invalid");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<EpicDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            _mockEpicService.Verify(s => s.GetAllAsync(), Times.Once);
            _mockEpicService.Verify(s => s.GetEpicsByPromiseAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetAll_WithEmptyPromiseIdParameter_ReturnsAllEpics()
        {
            // Arrange
            var epics = new List<Epic>
            {
                new Epic { Id = 1, Statement = "Epic 1", ProductPromiseId = 10 }
            };

            _mockEpicService.Setup(s => s.GetAllAsync()).ReturnsAsync(epics);
            _mockMapper.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
                .Returns<Epic, IGenericService<Epic>>((e, svc) => new EpicDTO
                {
                    Id = e.Id,
                    Statement = e.Statement,
                    ProductPromiseId = e.ProductPromiseId
                });

            // Setup HttpContext with empty promiseId value
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?promiseId=");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<EpicDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            _mockEpicService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithPromiseIdParameter_ReturnsEmptyListWhenNoEpicsFound()
        {
            // Arrange
            int promiseId = 999;
            var epics = new List<Epic>();

            _mockEpicService.Setup(s => s.GetEpicsByPromiseAsync(promiseId)).ReturnsAsync(epics);
            _mockMapper.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
                .Returns<Epic, IGenericService<Epic>>((e, svc) => new EpicDTO
                {
                    Id = e.Id,
                    Statement = e.Statement,
                    ProductPromiseId = e.ProductPromiseId
                });

            // Setup HttpContext with promiseId query parameter
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?promiseId={promiseId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<EpicDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(0));
            _mockEpicService.Verify(s => s.GetEpicsByPromiseAsync(promiseId), Times.Once);
        }

        #endregion

        #region Inherited Methods Tests

        [Test]
        public async Task GetById_WithValidId_ReturnsOkWithEpicDTO()
        {
            // Arrange
            int epicId = 1;
            var epic = new Epic { Id = epicId, Statement = "Test Epic", ProductPromiseId = 10 };
            var expectedDto = new EpicDTO { Id = epicId, Statement = "Test Epic", ProductPromiseId = 10 };

            _mockEpicService.Setup(s => s.GetByIdAsync(epicId)).ReturnsAsync(epic);
            _mockMapper.Setup(m => m.Map(epic, _mockEpicService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.GetById(epicId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());

            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);

            var dto = okResult!.Value as EpicDTO;
            Assert.That(dto, Is.Not.Null);

            Assert.That(dto!.Id, Is.EqualTo(epicId));
            Assert.That(dto.Statement, Is.EqualTo("Test Epic"));
        }

        [Test]
        public async Task GetById_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int epicId = 999;
            _mockEpicService.Setup(s => s.GetByIdAsync(epicId)).ReturnsAsync((Epic?)null);

            // Act
            var result = await _controller.GetById(epicId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
            _mockEpicService.Verify(s => s.GetByIdAsync(epicId), Times.Once);
        }

        [Test]
        public async Task Create_WithValidEpic_ReturnsCreatedAtAction()
        {
            // Arrange
            var epic = new Epic { Id = 1, Statement = "New Epic", ProductPromiseId = 10 };
            var expectedDto = new EpicDTO { Id = 1, Statement = "New Epic", ProductPromiseId = 10 };

            _mockEpicService.Setup(s => s.AddAsync(epic)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(epic, _mockEpicService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.Create(epic);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult, Is.Not.Null);
            Assert.That(createdResult!.ActionName, Is.EqualTo(nameof(EpicsController.GetById)));
            Assert.That(createdResult!.RouteValues["id"], Is.EqualTo(1));
            var dto = createdResult.Value as EpicDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(1));
        }

        [Test]
        public async Task Update_WithValidIdAndEpic_ReturnsNoContent()
        {
            // Arrange
            int epicId = 1;
            var epic = new Epic { Id = epicId, Statement = "Updated Epic", ProductPromiseId = 10 };

            _mockEpicService.Setup(s => s.UpdateAsync(epic)).Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Update(epicId, epic);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockEpicService.Verify(s => s.UpdateAsync(epic), Times.Once);
        }

        [Test]
        public async Task Update_WithMismatchedId_ReturnsBadRequest()
        {
            // Arrange
            int epicId = 1;
            var epic = new Epic { Id = 2, Statement = "Updated Epic", ProductPromiseId = 10 };

            // Act
            var result = await _controller.Update(epicId, epic);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestResult>());
            _mockEpicService.Verify(s => s.UpdateAsync(It.IsAny<Epic>()), Times.Never);
        }

        [Test]
        public async Task Delete_WithValidId_ReturnsNoContent()
        {
            // Arrange
            int epicId = 1;
            _mockEpicService.Setup(s => s.DeleteByIdAsync(epicId)).ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(epicId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockEpicService.Verify(s => s.DeleteByIdAsync(epicId), Times.Once);
        }

        [Test]
        public async Task Delete_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int epicId = 999;
            _mockEpicService.Setup(s => s.DeleteByIdAsync(epicId)).ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(epicId);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
            _mockEpicService.Verify(s => s.DeleteByIdAsync(epicId), Times.Once);
        }

        #endregion
    }
}
