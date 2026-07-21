using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class ProjectEpicsControllerUnitTests
{
    private Mock<IProjectService> _projectServiceMock = null!;
    private Mock<IGenericService<Epic>> _serviceMock = null!;
    private Mock<IGenericMapper<Epic, EpicDto>> _mapperMock = null!;
    private PromiseModelOnlineContext _context = null!;
    private ProjectEpicsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _projectServiceMock = new Mock<IProjectService>();
        _serviceMock = new Mock<IGenericService<Epic>>();
        _mapperMock = new Mock<IGenericMapper<Epic, EpicDto>>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new ProjectEpicsController(
            _serviceMock.Object,
            _mapperMock.Object,
            _context,
            _projectServiceMock.Object);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    private static Project Project(int id = 1) => new() { Id = id, Name = "P", Slug = "p", OwnerId = 1 };

    private static Promise Promise(int id = 10, int projectId = 1, int seq = 1) => new()
    {
        Id = id,
        ProjectId = projectId,
        Statement = $"P{seq}",
        SequenceNumber = seq,
        DisplayOrder = seq
    };

    private static Epic Epic(int id = 20, int promiseId = 10, int seq = 1) => new()
    {
        Id = id,
        ProductPromiseId = promiseId,
        Statement = $"E{seq}",
        SequenceNumber = seq,
        DisplayOrder = seq
    };

    private void SetupEditPermission()
    {
        var permissionServiceMock = new Mock<IPermissionService>();
        var userRepoMock = new Mock<IUserRepository>();
        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permissionServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));
        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.Edit);
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic()); await _context.SaveChangesAsync();
        _mapperMock.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
            .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDto { Id = e.Id });

        // Act
        var result = await _controller.GetAll("o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ProjectNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        // Act
        var result = await _controller.GetAll("bad", "bad");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_FilterByPromiseSeq_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Promises.Add(Promise(id: 10, seq: 1)); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(id: 20, promiseId: 10)); await _context.SaveChangesAsync();
        _mapperMock.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
            .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDto { Id = e.Id });

        // Act
        var result = await _controller.GetAll("o", "p", promiseSeq: 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_FilterByPromiseSeq_PromiseNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        // Act
        var result = await _controller.GetAll("o", "p", promiseSeq: 999);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_Found_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(seq: 1)); await _context.SaveChangesAsync();
        _mapperMock.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
            .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDto { Id = e.Id });

        // Act
        var result = await _controller.GetBySeq(1, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_NotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        // Act
        var result = await _controller.GetBySeq(999, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_ProjectNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        // Act
        var result = await _controller.GetBySeq(1, "bad", "bad");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_Found_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(id: 42)); await _context.SaveChangesAsync();
        _mapperMock.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
            .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDto { Id = e.Id });

        // Act
        var result = await _controller.GetById(42, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_NotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        // Act
        var result = await _controller.GetById(999, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_Valid_Returns201()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _serviceMock.Setup(s => s.AddAsync(It.IsAny<Epic>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
            .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDto { Id = e.Id });

        // Act
        var result = await _controller.CreateFromDto(new CreateEpicRequestDto { ProductPromiseId = 10 }, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NullBody_Returns400()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        // Act
        var result = await _controller.CreateFromDto(null!, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NoPermission_Returns403()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        var permissionServiceMock = new Mock<IPermissionService>();
        var userRepoMock = new Mock<IUserRepository>();
        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permissionServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));
        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.View);

        // Act
        var result = await _controller.CreateFromDto(new CreateEpicRequestDto(), "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_Valid_Returns204()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(id: 20, seq: 1)); await _context.SaveChangesAsync();
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<Epic>())).Returns(Task.CompletedTask);

        var dto = new UpdateEpicRequestDto { Id = 20, Statement = "Updated" };
        // Act
        var result = await _controller.Update(1, dto, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_IdMismatch_Returns400()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(id: 20, seq: 1)); await _context.SaveChangesAsync();

        var dto = new UpdateEpicRequestDto { Id = 99, Statement = "Bad" };
        // Act
        var result = await _controller.Update(1, dto, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_NullBody_Returns400()
    {
        // Arrange
        var result = await _controller.Update(1, null!, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_Valid_Returns204()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(id: 20, seq: 1)); await _context.SaveChangesAsync();
        _serviceMock.Setup(s => s.DeleteByIdAsync(20)).ReturnsAsync(true);

        // Act
        var result = await _controller.Delete(1, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_NotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        // Act
        var result = await _controller.Delete(999, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateDescription_Valid_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _context.Epics.Add(Epic(id: 20, seq: 1)); await _context.SaveChangesAsync();
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<Epic>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
            .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDto { Id = e.Id });

        // Act
        var result = await _controller.UpdateDescription(1, new UpdateDescriptionRequestDto { Description = "New desc" }, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateDescription_NullBody_Returns400()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        // Act
        var result = await _controller.UpdateDescription(1, null!, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    private static IServiceProvider CreateServiceProvider(params (Type type, object service)[] services)
    {
        var dict = new Dictionary<Type, object>();
        foreach (var (type, service) in services) dict[type] = service;
        return new MockServiceProvider(dict);
    }

    private sealed class MockServiceProvider(Dictionary<Type, object> services) : IServiceProvider
    {
        public object? GetService(Type serviceType) =>
            services.TryGetValue(serviceType, out var service) ? service : null;
    }
}
