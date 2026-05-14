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
    public class FlowsControllerUnitTests
    {
        private Mock<IFlowService> _mockFlowService = null!;
        private Mock<IGenericMapper<Flow, FlowDTO>> _mockMapper = null!;
        private FlowsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockFlowService = new Mock<IFlowService>();
            _mockMapper = new Mock<IGenericMapper<Flow, FlowDTO>>();
            _controller = new FlowsController(_mockFlowService.Object, _mockMapper.Object);
        }

        #region GetAll Tests

        [Test]
        public async Task GetAll_WithoutJourneyIdParameter_ReturnsAllFlows()
        {
            // Arrange
            var flows = new List<Flow>
            {
                new Flow { Id = 1, Statement = "Flow 1", JourneyId = 10 },
                new Flow { Id = 2, Statement = "Flow 2", JourneyId = 10 },
                new Flow { Id = 3, Statement = "Flow 3", JourneyId = 20 }
            };

            _mockFlowService.Setup(s => s.GetAllAsync()).ReturnsAsync(flows);
            _mockMapper.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>() ))
                .Returns<Flow, IGenericService<Flow>>((f, svc) => new FlowDTO
                {
                    Id = f.Id,
                    Statement = f.Statement,
                    JourneyId = f.JourneyId,
                    Description = f.Description,
                    OwnerId = f.OwnerId,
                    DisplayOrder = f.DisplayOrder,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                    StatusColor = f.StatusColor
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
            var dtos = okResult!.Value as List<FlowDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(3));
            Assert.That(dtos[0].Id, Is.EqualTo(1));
            _mockFlowService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithValidJourneyIdParameter_ReturnsFlowsFilteredByJourney()
        {
            // Arrange
            int journeyId = 10;
            var flows = new List<Flow>
            {
                new Flow { Id = 1, Statement = "Flow 1", JourneyId = 10 },
                new Flow { Id = 2, Statement = "Flow 2", JourneyId = 10 }
            };

            _mockFlowService.Setup(s => s.GetFlowsByJourneyAsync(journeyId)).ReturnsAsync(flows);
            _mockMapper.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>() ))
                .Returns<Flow, IGenericService<Flow>>((f, svc) => new FlowDTO
                {
                    Id = f.Id,
                    Statement = f.Statement,
                    JourneyId = f.JourneyId,
                    Description = f.Description,
                    OwnerId = f.OwnerId,
                    DisplayOrder = f.DisplayOrder,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                    StatusColor = f.StatusColor
                });

            // Setup HttpContext with journeyId query parameter
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?journeyId={journeyId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult!.Value as List<FlowDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].JourneyId, Is.EqualTo(10));
            _mockFlowService.Verify(s => s.GetFlowsByJourneyAsync(journeyId), Times.Once);
            _mockFlowService.Verify(s => s.GetAllAsync(), Times.Never);
        }

        [Test]
        public async Task GetAll_WithInvalidJourneyIdParameter_ReturnsAllFlows()
        {
            // Arrange
            var flows = new List<Flow>
            {
                new Flow { Id = 1, Statement = "Flow 1", JourneyId = 10 },
                new Flow { Id = 2, Statement = "Flow 2", JourneyId = 20 }
            };

            _mockFlowService.Setup(s => s.GetAllAsync()).ReturnsAsync(flows);
            _mockMapper.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>() ))
                .Returns<Flow, IGenericService<Flow>>((f, svc) => new FlowDTO
                {
                    Id = f.Id,
                    Statement = f.Statement,
                    JourneyId = f.JourneyId,
                    Description = f.Description,
                    OwnerId = f.OwnerId,
                    DisplayOrder = f.DisplayOrder,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                    StatusColor = f.StatusColor
                });

            // Setup HttpContext with invalid journeyId (non-integer)
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?journeyId=invalid");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult!.Value as List<FlowDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            _mockFlowService.Verify(s => s.GetAllAsync(), Times.Once);
            _mockFlowService.Verify(s => s.GetFlowsByJourneyAsync(It.IsAny<int>()), Times.Never);
        }

        [Test]
        public async Task GetAll_WithEmptyJourneyIdParameter_ReturnsAllFlows()
        {
            // Arrange
            var flows = new List<Flow>
            {
                new Flow { Id = 1, Statement = "Flow 1", JourneyId = 10 }
            };

            _mockFlowService.Setup(s => s.GetAllAsync()).ReturnsAsync(flows);
            _mockMapper.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>() ))
                .Returns<Flow, IGenericService<Flow>>((f, svc) => new FlowDTO
                {
                    Id = f.Id,
                    Statement = f.Statement,
                    JourneyId = f.JourneyId,
                    Description = f.Description,
                    OwnerId = f.OwnerId,
                    DisplayOrder = f.DisplayOrder,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                    StatusColor = f.StatusColor
                });

            // Setup HttpContext with empty journeyId value
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString("?journeyId=");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult!.Value as List<FlowDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            _mockFlowService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithValidJourneyIdParameter_ReturnsEmptyListWhenNoFlowsFound()
        {
            // Arrange
            int journeyId = 999;
            var flows = new List<Flow>();

            _mockFlowService.Setup(s => s.GetFlowsByJourneyAsync(journeyId)).ReturnsAsync(flows);
            _mockMapper.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>() ))
                .Returns<Flow, IGenericService<Flow>>((f, svc) => new FlowDTO
                {
                    Id = f.Id,
                    Statement = f.Statement,
                    JourneyId = f.JourneyId,
                    Description = f.Description,
                    OwnerId = f.OwnerId,
                    DisplayOrder = f.DisplayOrder,
                    CreatedAt = f.CreatedAt,
                    UpdatedAt = f.UpdatedAt,
                    StatusColor = f.StatusColor
                });

            // Setup HttpContext with journeyId query parameter
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?journeyId={journeyId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dtos = okResult!.Value as List<FlowDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(0));
            _mockFlowService.Verify(s => s.GetFlowsByJourneyAsync(journeyId), Times.Once);
        }

        #endregion

        #region Inherited Methods Tests

        [Test]
        public async Task GetById_WithValidId_ReturnsOkWithFlowDTO()
        {
            // Arrange
            int flowId = 1;
            var flow = new Flow { Id = flowId, Statement = "Test Flow", JourneyId = 10 };
            var expectedDto = new FlowDTO { Id = flowId, Statement = "Test Flow", JourneyId = 10 };

            _mockFlowService.Setup(s => s.GetByIdAsync(flowId)).ReturnsAsync(flow);
            _mockMapper.Setup(m => m.Map(flow, _mockFlowService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.GetById(flowId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult, Is.Not.Null);
            var dto = okResult!.Value as FlowDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(flowId));
            Assert.That(dto.Statement, Is.EqualTo("Test Flow"));
        }

        [Test]
        public async Task GetById_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int flowId = 999;
            _mockFlowService.Setup(s => s.GetByIdAsync(flowId)).ReturnsAsync((Flow?)null);

            // Act
            var result = await _controller.GetById(flowId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
            _mockFlowService.Verify(s => s.GetByIdAsync(flowId), Times.Once);
        }

        [Test]
        public async Task Create_WithValidFlow_ReturnsCreatedAtAction()
        {
            // Arrange
            var flow = new Flow { Id = 1, Statement = "New Flow", JourneyId = 10 };
            var expectedDto = new FlowDTO { Id = 1, Statement = "New Flow", JourneyId = 10 };

            _mockFlowService.Setup(s => s.AddAsync(flow)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(flow, _mockFlowService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.Create(flow);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult, Is.Not.Null);
            Assert.That(createdResult!.ActionName, Is.EqualTo(nameof(FlowsController.GetById)));
            Assert.That(createdResult.RouteValues["id"], Is.EqualTo(1));
            var dto = createdResult.Value as FlowDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(1));
        }

        [Test]
        public async Task Update_WithValidIdAndFlow_ReturnsNoContent()
        {
            // Arrange
            int flowId = 1;
            var flow = new Flow { Id = flowId, Statement = "Updated Flow", JourneyId = 10 };

            _mockFlowService.Setup(s => s.UpdateAsync(flow)).Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Update(flowId, flow);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockFlowService.Verify(s => s.UpdateAsync(flow), Times.Once);
        }

        [Test]
        public async Task Update_WithMismatchedId_ReturnsBadRequest()
        {
            // Arrange
            int flowId = 1;
            var flow = new Flow { Id = 2, Statement = "Updated Flow", JourneyId = 10 };

            // Act
            var result = await _controller.Update(flowId, flow);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestResult>());
            _mockFlowService.Verify(s => s.UpdateAsync(It.IsAny<Flow>()), Times.Never);
        }

        [Test]
        public async Task Delete_WithValidId_ReturnsNoContent()
        {
            // Arrange
            int flowId = 1;
            _mockFlowService.Setup(s => s.DeleteByIdAsync(flowId)).ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(flowId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockFlowService.Verify(s => s.DeleteByIdAsync(flowId), Times.Once);
        }

        [Test]
        public async Task Delete_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int flowId = 999;
            _mockFlowService.Setup(s => s.DeleteByIdAsync(flowId)).ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(flowId);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
            _mockFlowService.Verify(s => s.DeleteByIdAsync(flowId), Times.Once);
        }

        #endregion
    }
}
