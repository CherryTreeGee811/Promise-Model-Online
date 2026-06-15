using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.Mappers.Interfaces;

namespace PromiseModelOnline.Api.Tests
{
	/// <summary>Unit tests for <see cref="GenericController{TEntity, TDto}"/> covering CRUD operations.</summary>
// Requirements: REQ_SYS_003
	public class GenericControllerUnitTests
	{
		private Mock<IGenericService<TestEntity>> _mockService = null!;
		private Mock<IGenericMapper<TestEntity, TestDto>> _mockMapper = null!;
		private TestGenericController _controller = null!;

		[SetUp]
		public void SetUp()
		{
			_mockService = new Mock<IGenericService<TestEntity>>();
			_mockMapper = new Mock<IGenericMapper<TestEntity, TestDto>>();
			_controller = new TestGenericController(_mockService.Object, _mockMapper.Object);
		}

        [Test]
        public async Task REQ_SYS_003_GetAll_ReturnsOkWithMappedDtos()
        {
            // Arrange
            var entities = new List<TestEntity>
            {
                new TestEntity { Id = 1, Name = "First" },
                new TestEntity { Id = 2, Name = "Second" }
            };

            _mockService.Setup(s => s.GetAllAsync()).ReturnsAsync(entities);
            _mockMapper.Setup(m => m.Map(It.IsAny<TestEntity>(), It.IsAny<IGenericService<TestEntity>>()))
                       .Returns<TestEntity, IGenericService<TestEntity>>((entity, service) => new TestDto
                       {
                           Id = entity.Id,
                           Name = entity.Name
                       });

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);

            var dtos = ok!.Value as List<TestDto>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].Id, Is.EqualTo(1));
            Assert.That(dtos[1].Name, Is.EqualTo("Second"));
        }

        [Test]
        public async Task REQ_SYS_003_GetById_WhenEntityExists_ReturnsOkWithMappedDto()
        {
            // Arrange
            var entity = new TestEntity { Id = 7, Name = "Seven" };
            _mockService.Setup(s => s.GetByIdAsync(7)).ReturnsAsync(entity);
            _mockMapper.Setup(m => m.Map(entity, It.IsAny<IGenericService<TestEntity>>()))
                       .Returns(new TestDto { Id = 7, Name = "Seven" });

            // Act
            var result = await _controller.GetById(7);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dto = ok!.Value as TestDto;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(7));
        }

        [Test]
        public async Task REQ_SYS_003_GetById_WhenEntityMissing_ReturnsNotFound()
        {
            // Arrange
            _mockService.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((TestEntity?)null);

            // Act
            var result = await _controller.GetById(99);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task REQ_SYS_003_Create_ReturnsCreatedAtActionWithMappedDtoAndRouteId()
        {
            // Arrange
            var entity = new TestEntity { Id = 21, Name = "Created" };
            _mockMapper.Setup(m => m.Map(entity, It.IsAny<IGenericService<TestEntity>>()))
                       .Returns(new TestDto { Id = 21, Name = "Created" });

            // Act
            var result = await _controller.Create(entity);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = result.Result as CreatedAtActionResult;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.ActionName, Is.EqualTo(nameof(TestGenericController.GetById)));
            Assert.That(created.RouteValues, Is.Not.Null);
            Assert.That(created.RouteValues!["id"], Is.EqualTo(21));

            var dto = created.Value as TestDto;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Name, Is.EqualTo("Created"));
            _mockService.Verify(s => s.AddAsync(entity), Times.Once);
        }

        [Test]
        public async Task REQ_SYS_003_Update_WithMatchingId_ReturnsNoContentAndUpdatesEntity()
        {
            // Arrange
            var entity = new TestEntity { Id = 31, Name = "Updated" };

            // Act
            var result = await _controller.Update(31, entity);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockService.Verify(s => s.UpdateAsync(entity), Times.Once);
        }

        [Test]
        public async Task REQ_SYS_003_Update_WithMismatchedId_ReturnsBadRequestWithoutUpdating()
        {
            // Arrange
            var entity = new TestEntity { Id = 40, Name = "Mismatch" };

            // Act
            var result = await _controller.Update(41, entity);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestResult>());
            _mockService.Verify(s => s.UpdateAsync(It.IsAny<TestEntity>()), Times.Never);
        }

        [Test]
        public async Task REQ_SYS_003_Delete_WhenServiceDeletes_ReturnsNoContent()
        {
            // Arrange
            _mockService.Setup(s => s.DeleteByIdAsync(55)).ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(55);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockService.Verify(s => s.DeleteByIdAsync(55), Times.Once);
        }

        [Test]
        public async Task REQ_SYS_003_Delete_WhenEntityMissing_ReturnsNotFound()
        {
            // Arrange
            _mockService.Setup(s => s.DeleteByIdAsync(66)).ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(66);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

		private sealed class TestGenericController : GenericController<TestEntity, TestDto>
		{
			public TestGenericController(IGenericService<TestEntity> service, IGenericMapper<TestEntity, TestDto> mapper)
				: base(service, mapper)
			{
			}
		}

		public sealed class TestEntity
		{
			public int Id { get; set; }

			public string? Name { get; set; }
		}

		public sealed class TestDto
		{
			public int Id { get; set; }

			public string? Name { get; set; }
		}
	}
}
