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
    public class JourneysControllerUnitTests
    {
        private Mock<IJourneyService> _mockJourneyService = null!;
        private Mock<IGenericMapper<Journey, JourneyDTO>> _mockMapper = null!;
        private JourneysController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockJourneyService = new Mock<IJourneyService>();
            _mockMapper = new Mock<IGenericMapper<Journey, JourneyDTO>>();
            _controller = new JourneysController(_mockJourneyService.Object, _mockMapper.Object);
        }

        #region GetAll Tests

        [Test]
        public async Task GetAll_WithoutEpicIdParameter_ReturnsAllJourneys()
        {
            // Arrange
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Journey 1", EpicId = 10 },
                new Journey { Id = 2, Statement = "Journey 2", EpicId = 10 },
                new Journey { Id = 3, Statement = "Journey 3", EpicId = 20 }
            };

            _mockJourneyService.Setup(s => s.GetAllAsync()).ReturnsAsync(journeys);
            _mockMapper.Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns<Journey, IGenericService<Journey>>((j, svc) => new JourneyDTO
                {
                    Id = j.Id,
                    Statement = j.Statement,
                    EpicId = j.EpicId
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
            var dtos = okResult?.Value as List<JourneyDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(3));
            Assert.That(dtos[0].Id, Is.EqualTo(1));
            _mockJourneyService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithValidEpicIdParameter_ReturnsJourneysFilteredByEpic()
        {
            // Arrange
            int epicId = 10;
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Journey 1", EpicId = 10 },
                new Journey { Id = 2, Statement = "Journey 2", EpicId = 10 }
            };

            _mockJourneyService.Setup(s => s.GetJourneysByEpicAsync(epicId)).ReturnsAsync(journeys);
            _mockMapper.Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns<Journey, IGenericService<Journey>>((j, svc) => new JourneyDTO
                {
                    Id = j.Id,
                    Statement = j.Statement,
                    EpicId = j.EpicId
                });

            // Setup HttpContext with epicId query parameter
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?epicId={epicId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<JourneyDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].EpicId, Is.EqualTo(10));
            _mockJourneyService.Verify(s => s.GetJourneysByEpicAsync(epicId), Times.Once);
            _mockJourneyService.Verify(s => s.GetAllAsync(), Times.Never);
        }

        [Test]
        public async Task GetAll_WithInvalidEpicIdParameter_ReturnsAllJourneys()
        {
            // Arrange
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Journey 1", EpicId = 10 },
                new Journey { Id = 2, Statement = "Journey 2", EpicId = 20 }
            };

            _mockJourneyService.Setup(s => s.GetAllAsync()).ReturnsAsync(journeys);
            _mockMapper.Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns<Journey, IGenericService<Journey>>((j, svc) => new JourneyDTO
                {
                    Id = j.Id,
                    Statement = j.Statement,
                    EpicId = j.EpicId
                });

            // Setup HttpContext with invalid epicId (non-integer)
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?epicId=invalid");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<JourneyDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            _mockJourneyService.Verify(s => s.GetAllAsync(), Times.Once);
            _mockJourneyService.Verify(s => s.GetJourneysByEpicAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetAll_WithEmptyEpicIdParameter_ReturnsAllJourneys()
        {
            // Arrange
            var journeys = new List<Journey>
            {
                new Journey { Id = 1, Statement = "Journey 1", EpicId = 10 }
            };

            _mockJourneyService.Setup(s => s.GetAllAsync()).ReturnsAsync(journeys);
            _mockMapper.Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns<Journey, IGenericService<Journey>>((j, svc) => new JourneyDTO
                {
                    Id = j.Id,
                    Statement = j.Statement,
                    EpicId = j.EpicId
                });

            // Setup HttpContext with empty epicId value
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?epicId=");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<JourneyDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            _mockJourneyService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithValidEpicIdParameter_ReturnsEmptyListWhenNoJourneysFound()
        {
            // Arrange
            int epicId = 999;
            var journeys = new List<Journey>();

            _mockJourneyService.Setup(s => s.GetJourneysByEpicAsync(epicId)).ReturnsAsync(journeys);
            _mockMapper.Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns<Journey, IGenericService<Journey>>((j, svc) => new JourneyDTO
                {
                    Id = j.Id,
                    Statement = j.Statement,
                    EpicId = j.EpicId
                });

            // Setup HttpContext with epicId query parameter
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?epicId={epicId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult?.Value as List<JourneyDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(0));
            _mockJourneyService.Verify(s => s.GetJourneysByEpicAsync(epicId), Times.Once);
        }

        #endregion

        #region Inherited Methods Tests

        [Test]
        public async Task GetById_WithValidId_ReturnsOkWithJourneyDTO()
        {
            // Arrange
            int journeyId = 1;
            var journey = new Journey { Id = journeyId, Statement = "Test Journey", EpicId = 10 };
            var expectedDto = new JourneyDTO { Id = journeyId, Statement = "Test Journey", EpicId = 10 };

            _mockJourneyService.Setup(s => s.GetByIdAsync(journeyId)).ReturnsAsync(journey);
            _mockMapper.Setup(m => m.Map(journey, _mockJourneyService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.GetById(journeyId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dto = okResult?.Value as JourneyDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto?.Id, Is.EqualTo(journeyId));
            Assert.That(dto.Statement, Is.EqualTo("Test Journey"));
        }

        [Test]
        public async Task GetById_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int journeyId = 999;
            _mockJourneyService.Setup(s => s.GetByIdAsync(journeyId)).ReturnsAsync((Journey?)null);

            // Act
            var result = await _controller.GetById(journeyId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
            _mockJourneyService.Verify(s => s.GetByIdAsync(journeyId), Times.Once);
        }

        [Test]
        public async Task Create_WithValidJourney_ReturnsCreatedAtAction()
        {
            // Arrange
            var journey = new Journey { Id = 1, Statement = "New Journey", EpicId = 10 };
            var expectedDto = new JourneyDTO { Id = 1, Statement = "New Journey", EpicId = 10 };

            _mockJourneyService.Setup(s => s.AddAsync(journey)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(journey, _mockJourneyService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.Create(journey);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult, Is.Not.Null);
            Assert.That(createdResult!.ActionName, Is.EqualTo(nameof(JourneysController.GetById)));
            Assert.That(createdResult!.RouteValues["id"], Is.EqualTo(1));
            var dto = createdResult.Value as JourneyDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(1));
        }

        [Test]
        public async Task Update_WithValidIdAndJourney_ReturnsNoContent()
        {
            // Arrange
            int journeyId = 1;
            var journey = new Journey { Id = journeyId, Statement = "Updated Journey", EpicId = 10 };

            _mockJourneyService.Setup(s => s.UpdateAsync(journey)).Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Update(journeyId, journey);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockJourneyService.Verify(s => s.UpdateAsync(journey), Times.Once);
        }

        [Test]
        public async Task Update_WithMismatchedId_ReturnsBadRequest()
        {
            // Arrange
            int journeyId = 1;
            var journey = new Journey { Id = 2, Statement = "Updated Journey", EpicId = 10 };

            // Act
            var result = await _controller.Update(journeyId, journey);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestResult>());
            _mockJourneyService.Verify(s => s.UpdateAsync(It.IsAny<Journey>()), Times.Never);
        }

        [Test]
        public async Task Delete_WithValidId_ReturnsNoContent()
        {
            // Arrange
            int journeyId = 1;
            _mockJourneyService.Setup(s => s.DeleteByIdAsync(journeyId)).ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(journeyId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockJourneyService.Verify(s => s.DeleteByIdAsync(journeyId), Times.Once);
        }

        [Test]
        public async Task Delete_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int journeyId = 999;
            _mockJourneyService.Setup(s => s.DeleteByIdAsync(journeyId)).ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(journeyId);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
            _mockJourneyService.Verify(s => s.DeleteByIdAsync(journeyId), Times.Once);
        }

        #endregion
    }
}
