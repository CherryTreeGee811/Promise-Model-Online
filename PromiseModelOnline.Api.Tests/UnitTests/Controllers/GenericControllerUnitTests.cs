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
		public async Task GetAll_ReturnsOkWithMappedDtos()
		{
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

			var result = await _controller.GetAll();

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
		public async Task GetById_WhenEntityExists_ReturnsOkWithMappedDto()
		{
			var entity = new TestEntity { Id = 7, Name = "Seven" };
			_mockService.Setup(s => s.GetByIdAsync(7)).ReturnsAsync(entity);
			_mockMapper.Setup(m => m.Map(entity, It.IsAny<IGenericService<TestEntity>>()))
					   .Returns(new TestDto { Id = 7, Name = "Seven" });

			var result = await _controller.GetById(7);

			Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
			var ok = result.Result as OkObjectResult;
			var dto = ok!.Value as TestDto;
			Assert.That(dto, Is.Not.Null);
			Assert.That(dto!.Id, Is.EqualTo(7));
		}

		[Test]
		public async Task GetById_WhenEntityMissing_ReturnsNotFound()
		{
			_mockService.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((TestEntity?)null);

			var result = await _controller.GetById(99);

			Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
		}

		[Test]
		public async Task Create_ReturnsCreatedAtActionWithMappedDtoAndRouteId()
		{
			var entity = new TestEntity { Id = 21, Name = "Created" };
			_mockMapper.Setup(m => m.Map(entity, It.IsAny<IGenericService<TestEntity>>()))
					   .Returns(new TestDto { Id = 21, Name = "Created" });

			var result = await _controller.Create(entity);

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
		public async Task Update_WithMatchingId_ReturnsNoContentAndUpdatesEntity()
		{
			var entity = new TestEntity { Id = 31, Name = "Updated" };

			var result = await _controller.Update(31, entity);

			Assert.That(result, Is.InstanceOf<NoContentResult>());
			_mockService.Verify(s => s.UpdateAsync(entity), Times.Once);
		}

		[Test]
		public async Task Update_WithMismatchedId_ReturnsBadRequestWithoutUpdating()
		{
			var entity = new TestEntity { Id = 40, Name = "Mismatch" };

			var result = await _controller.Update(41, entity);

			Assert.That(result, Is.InstanceOf<BadRequestResult>());
			_mockService.Verify(s => s.UpdateAsync(It.IsAny<TestEntity>()), Times.Never);
		}

		[Test]
		public async Task Delete_WhenServiceDeletes_ReturnsNoContent()
		{
			_mockService.Setup(s => s.DeleteByIdAsync(55)).ReturnsAsync(true);

			var result = await _controller.Delete(55);

			Assert.That(result, Is.InstanceOf<NoContentResult>());
			_mockService.Verify(s => s.DeleteByIdAsync(55), Times.Once);
		}

		[Test]
		public async Task Delete_WhenEntityMissing_ReturnsNotFound()
		{
			_mockService.Setup(s => s.DeleteByIdAsync(66)).ReturnsAsync(false);

			var result = await _controller.Delete(66);

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
